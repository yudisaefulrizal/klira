import { spawn } from 'node:child_process';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdtemp, open, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createInterface } from 'node:readline';
import { pipeline } from 'node:stream/promises';
import type { Readable } from 'node:stream';
import { pengaturanKeamananEfektif } from '@klira/shared';
import type { Halaman, PengaturanKeamananDto, PengaturanKeamananMasukan, PenggunaSaya, RiwayatBackupDto } from '@klira/shared';
import type { PenampungAudit } from '../../middleware/audit';
import type { BarisPengaturan, RepositoriKeamanan } from './repositori';

export type DependensiKeamanan = { repo: RepositoriKeamanan; audit: PenampungAudit };

/** Akar repositori; sama untuk src (uji) maupun dist karena kedalaman folder sama. */
const AKAR = path.resolve(__dirname, '../../../../..');

export class GalatCadangan extends Error {}

function sambunganDb() {
  const u = new URL(process.env.DATABASE_URL ?? '');
  return {
    arg: ['-h', u.hostname, '-P', u.port || '3306', '-u', decodeURIComponent(u.username)],
    nama: u.pathname.slice(1),
    env: { ...process.env, MYSQL_PWD: decodeURIComponent(u.password) },
  };
}

/** Menjalankan perintah, mengembalikan stdout; galat berisi stderr. */
function jalankan(perintah: string, arg: string[], opsi: { env?: NodeJS.ProcessEnv; masuk?: string | Readable; cwd?: string } = {}): Promise<string> {
  return new Promise((selesai, gagal) => {
    const anak = spawn(perintah, arg, { env: opsi.env ?? process.env, cwd: opsi.cwd, stdio: ['pipe', 'pipe', 'pipe'] });
    let keluar = '';
    let galat = '';
    anak.stdout.on('data', (d: Buffer) => (keluar += d.toString()));
    anak.stderr.on('data', (d: Buffer) => (galat += d.toString()));
    anak.on('error', gagal);
    anak.on('close', (kode) => (kode === 0 ? selesai(keluar) : gagal(new GalatCadangan(galat.trim().slice(-500) || `${perintah} gagal (${kode})`))));
    anak.stdin.on('error', () => undefined);
    if (typeof opsi.masuk === 'string') anak.stdin.end(opsi.masuk);
    else if (opsi.masuk) opsi.masuk.pipe(anak.stdin);
    else anak.stdin.end();
  });
}

/** Menghapus semua tabel di database aplikasi. */
async function kosongkanDb(): Promise<void> {
  const { arg, nama, env } = sambunganDb();
  const daftar = await jalankan('mysql', [...arg, '-N', '-B', nama, '-e', 'SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_type = \'BASE TABLE\''], { env });
  const tabel = daftar.split('\n').map((t) => t.trim()).filter(Boolean);
  if (!tabel.length) return;
  const sql = `SET FOREIGN_KEY_CHECKS=0;\n${tabel.map((t) => `DROP TABLE IF EXISTS \`${t.replace(/`/g, '``')}\`;`).join('\n')}\n`;
  await jalankan('mysql', [...arg, nama], { env, masuk: sql });
}

let sibuk = false;
async function eksklusif<T>(f: () => Promise<T>): Promise<T> {
  if (sibuk) throw new GalatCadangan('Proses cadangan lain sedang berjalan.');
  sibuk = true;
  try {
    return await f();
  } finally {
    sibuk = false;
  }
}

/** Aliran hasil mysqldump untuk diunduh; hubungi `tutup` bila klien memutus. */
export function mulaiUnduhBackup(): { aliran: Readable; selesai: Promise<void>; batal: () => void } {
  const { arg, nama, env } = sambunganDb();
  const anak = spawn('mysqldump', [...arg, '--single-transaction', '--routines', '--no-tablespaces', nama], { env, stdio: ['ignore', 'pipe', 'pipe'] });
  let galat = '';
  anak.stderr.on('data', (d: Buffer) => (galat += d.toString()));
  const selesai = new Promise<void>((ok, gagal) => {
    anak.on('error', gagal);
    anak.on('close', (kode) => (kode === 0 ? ok() : gagal(new GalatCadangan(galat.trim().slice(-500) || 'mysqldump gagal'))));
  });
  return { aliran: anak.stdout, selesai, batal: () => anak.kill() };
}

// Dua perbaikan pada dump sebelum dimuat: (1) trigger satu pernyataan yang tersimpan dengan titik koma di ujung
// ditulis mysqldump dengan titik koma sebelum penutup komentar versi, dan MySQL menolaknya; (2) klausa DEFINER
// ke akun/host lain butuh hak SUPER, jadi dibuang agar objek dimiliki user aplikasi.
const buangDefiner = (b: string) => (b.startsWith('/*!') ? b.replace(/\s*DEFINER=`[^`]*`@`[^`]*`/g, '') : b);
const rapikanBaris = (b: string) => buangDefiner(b.endsWith('*/;;') ? b.replace(/;\s*\*\/;;$/, ' */;;') : b);
async function bersihkanDump(asal: string, tujuan: string): Promise<void> {
  const keluar = createWriteStream(tujuan);
  const baris = createInterface({ input: createReadStream(asal), crlfDelay: Infinity });
  for await (const b of baris) {
    if (!keluar.write(rapikanBaris(b) + '\n')) await new Promise((r) => keluar.once('drain', r));
  }
  await new Promise<void>((selesai, gagal) => keluar.end((e?: Error | null) => (e ? gagal(e) : selesai())));
}

/** Pulihkan: simpan unggahan ke berkas sementara, periksa itu dump MySQL, hapus data lama, lalu muat. */
export async function pulihkanBackup(isi: Readable): Promise<void> {
  await eksklusif(async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'klira-pulih-'));
    const berkas = path.join(dir, 'backup.sql');
    try {
      await pipeline(isi, createWriteStream(berkas));
      const fh = await open(berkas, 'r');
      const kepala = Buffer.alloc(4096);
      const { bytesRead } = await fh.read(kepala, 0, 4096, 0);
      await fh.close();
      if (!/(MySQL|MariaDB) dump|CREATE TABLE/i.test(kepala.subarray(0, bytesRead).toString('utf8'))) {
        throw new GalatCadangan('Berkas bukan hasil backup Klira (.sql).');
      }
      const bersih = path.join(dir, 'bersih.sql');
      await bersihkanDump(berkas, bersih);
      await kosongkanDb();
      const { arg, nama, env } = sambunganDb();
      await jalankan('mysql', [...arg, nama], { env, masuk: createReadStream(bersih) });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
}

/** Reset: hapus semua tabel, bangun ulang lewat migrasi, lalu seed awal. */
export async function resetSistem(): Promise<void> {
  await eksklusif(async () => {
    await kosongkanDb();
    await jalankan(process.execPath, [path.join(AKAR, 'node_modules/prisma/build/index.js'), 'migrate', 'deploy', '--schema', path.join(AKAR, 'packages/db/prisma/schema.prisma')], { cwd: AKAR });
    await jalankan(process.execPath, [path.join(AKAR, 'packages/db/dist/seed/seed.js')], { cwd: AKAR });
  });
}

const keDto = (b: BarisPengaturan | null): PengaturanKeamananDto => ({
  ...pengaturanKeamananEfektif(b),
  bawaan: b === null,
  diubah_pada: b ? b.diubah_pada.toISOString() : null,
});

/** Nilai yang dibaca auth (sesi, pembatas, kata sandi); bawaan aman bila belum ada pengaturan. */
export async function bacaPengaturanKeamanan(repo: Pick<RepositoriKeamanan, 'ambilPengaturan'>, fasyankesId: number): Promise<PengaturanKeamananMasukan> {
  return pengaturanKeamananEfektif(await repo.ambilPengaturan(fasyankesId));
}

export function buatLayananKeamanan({ repo, audit }: DependensiKeamanan) {
  return {
    async ambil(p: Pick<PenggunaSaya, 'fasyankes_id'>): Promise<PengaturanKeamananDto> {
      return keDto(await repo.ambilPengaturan(p.fasyankes_id));
    },

    async simpan(p: Pick<PenggunaSaya, 'id' | 'fasyankes_id'>, nilai: PengaturanKeamananMasukan, alamat?: string): Promise<PengaturanKeamananDto> {
      const baris = await repo.simpanPengaturan(p.fasyankes_id, nilai, p.id);
      await audit.catat({
        fasyankes_id: p.fasyankes_id, pengguna_id: p.id, aksi: 'perbaikan', entitas: 'pengaturan_keamanan', entitas_id: null,
        keterangan: `Kebijakan akses: sesi ${nilai.masa_sesi_jam} jam, batas percobaan ${nilai.batas_percobaan_masuk}, kata sandi minimal ${nilai.panjang_minimum_kata_sandi}`,
        alamat,
      });
      return keDto(baris);
    },

    async daftarBackup(p: Pick<PenggunaSaya, 'fasyankes_id'>, halaman: number, ukuran: number): Promise<Halaman<RiwayatBackupDto>> {
      const { total, baris } = await repo.daftarBackup(p.fasyankes_id, (halaman - 1) * ukuran, ukuran);
      return {
        data: baris.map((b) => ({ id: b.id, waktu: b.waktu.toISOString(), status: b.status, ukuran_byte: b.ukuran_byte, lokasi: b.lokasi })),
        halaman, ukuran, total,
      };
    },
  };
}

export type LayananKeamanan = ReturnType<typeof buatLayananKeamanan>;
