import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, writeFile, open, unlink } from 'node:fs/promises';
import { join } from 'node:path';

export type BerkasMigrasi = { nomor: number; nama: string; checksum: string; sql: string };
export type CatatanMigrasi = { nomor: number; nama: string; checksum: string; selesai_pada: Date | null };

export async function bacaMigrasi(folder: string): Promise<BerkasMigrasi[]> {
  const nama = (await readdir(folder)).filter(n => n.endsWith('.sql')).sort();
  const nomorTerpakai = new Set<number>();
  const hasil: BerkasMigrasi[] = [];
  for (const n of nama) {
    const cocok = /^(\d{4,})_([a-z0-9]+(?:_[a-z0-9]+)*)\.sql$/.exec(n);
    if (!cocok) throw new Error(`Nama migrasi tidak sah: ${n}`);
    const nomor = Number(cocok[1]);
    if (!Number.isSafeInteger(nomor) || nomor < 1 || nomorTerpakai.has(nomor)) throw new Error(`Nomor migrasi ganda atau tidak sah: ${n}`);
    nomorTerpakai.add(nomor);
    const sql = await readFile(join(folder, n), 'utf8');
    hasil.push({ nomor, nama: n, sql, checksum: createHash('sha256').update(sql).digest('hex') });
  }
  return hasil.sort((a, b) => a.nomor - b.nomor);
}

export function periksaRiwayat(berkas: BerkasMigrasi[], catatan: CatatanMigrasi[]): void {
  const tersedia = new Map(berkas.map(b => [b.nomor, b]));
  for (const c of catatan) {
    const b = tersedia.get(c.nomor);
    if (!b || b.nama !== c.nama) throw new Error(`Berkas migrasi tercatat hilang atau berganti nama: ${c.nama}`);
    if (b.checksum !== c.checksum) throw new Error(`Checksum berubah: ${c.nama}. Buat migrasi baru untuk perbaikan.`);
    if (!c.selesai_pada) throw new Error(`Migrasi ${c.nama} belum selesai. Periksa keadaan database sebelum memperbaiki catatan migrasi; DDL tidak diulang otomatis.`);
  }
  const terakhir = Math.max(0, ...catatan.map(c => c.nomor));
  const tercatat = new Set(catatan.map(c => c.nomor));
  if (berkas.some(b => b.nomor < terakhir && !tercatat.has(b.nomor))) throw new Error('Ada migrasi baru dengan nomor sebelum migrasi yang sudah diterapkan. Gunakan nomor berikutnya.');
}

export async function buatMigrasi(folder: string, judul: string): Promise<string> {
  if (!/^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(judul)) throw new Error('Nama harus berupa huruf kecil, angka, dan garis bawah.');
  await mkdir(folder, { recursive: true });
  const pengunci = join(folder, '.nomor-migrasi.lock');
  const kunci = await open(pengunci, 'wx').catch(() => { throw new Error('Pembuatan migrasi lain sedang berjalan.'); });
  try {
    const berkas = await bacaMigrasi(folder);
    const nomor = Math.max(0, ...berkas.map(b => b.nomor)) + 1;
    const nama = `${String(nomor).padStart(4, '0')}_${judul}.sql`;
    await writeFile(join(folder, nama), '-- Tulis SQL migrasi di bawah ini.\n', { flag: 'wx' });
    return nama;
  } finally { await kunci.close(); await unlink(pengunci); }
}

/** Pemisah pernyataan mendukung kutipan, komentar, dan DELIMITER untuk trigger. */
export function pecahSql(sql: string): string[] {
  const hasil: string[] = [];
  let bagian = '', delimiter = ';', kutip = '', komentar = '', awalBaris = true;
  for (let i = 0; i < sql.length;) {
    if (!kutip && !komentar && awalBaris) {
      const direktif = /^[\t ]*DELIMITER[\t ]+(\S+)[\t ]*(?:\r?\n|$)/i.exec(sql.slice(i));
      if (direktif) {
        if (bagian.trim()) throw new Error('DELIMITER harus berada di antara pernyataan SQL.');
        delimiter = direktif[1]; i += direktif[0].length; continue;
      }
    }
    const c = sql[i], n = sql[i + 1];
    if (komentar) {
      if (komentar === 'blok' && c === '*' && n === '/') { komentar = ''; bagian += ' '; i += 2; continue; }
      if (komentar === 'baris' && c === '\n') { komentar = ''; bagian += '\n'; awalBaris = true; }
      i++; continue;
    }
    if (kutip) {
      bagian += c; i++;
      if (c === '\\') { if (i < sql.length) bagian += sql[i++]; }
      else if (c === kutip) {
        if (sql[i] === kutip) bagian += sql[i++]; else kutip = '';
      }
      awalBaris = c === '\n'; continue;
    }
    if (sql.startsWith(delimiter, i)) {
      if (bagian.trim()) hasil.push(bagian.trim());
      bagian = ''; i += delimiter.length; awalBaris = false; continue;
    }
    if (c === '/' && n === '*') {
      if (sql[i + 2] === '!') throw new Error('Gunakan SQL eksplisit, bukan komentar SQL bersyarat.');
      komentar = 'blok'; i += 2; continue;
    }
    if (c === '#' || (c === '-' && n === '-' && /\s/.test(sql[i + 2] ?? '\n'))) { komentar = 'baris'; i += c === '#' ? 1 : 2; continue; }
    if (c === "'" || c === '"' || c === '`') kutip = c;
    bagian += c; awalBaris = c === '\n'; i++;
  }
  if (kutip || komentar === 'blok') throw new Error('Kutipan atau komentar SQL belum ditutup.');
  if (bagian.trim()) throw new Error('Pernyataan SQL terakhir belum ditutup delimiter.');
  return hasil;
}
