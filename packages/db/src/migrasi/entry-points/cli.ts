import { resolve } from 'node:path';
import { pool, tutupPool } from '../../koneksi';
import { bacaMigrasi, buatMigrasi, pecahSql, periksaRiwayat } from '../domain/berkas';
import { catatMulai, catatSelesai, daftarRiwayat, daftarTabel, hapusTabel, kunciMigrasi, lepasKunci, siapkanRiwayat } from '../data-access/riwayat';

export async function jalankanMigrasi(args: string[], folder = resolve(__dirname, '../../../migrasi'), env: NodeJS.ProcessEnv = process.env): Promise<void> {
  const [perintah, nama, ...sisa] = args;
  if (!['terapkan', 'status', 'baru', 'fresh'].includes(perintah) || sisa.length || (perintah !== 'baru' && nama)) throw new Error('Pemakaian: migrasi terapkan | status | baru nama_migrasi | fresh');
  if (perintah === 'fresh' && env.NODE_ENV !== 'development' && env.NODE_ENV !== 'test') throw new Error('fresh hanya diizinkan ketika NODE_ENV=development atau test.');
  if (perintah === 'baru') {
    if (!nama) throw new Error('Berikan nama migrasi.');
    console.log(await buatMigrasi(folder, nama));
    return;
  }
  const berkas = await bacaMigrasi(folder);
  // Validasi seluruh berkas sebelum satu DDL pun dijalankan.
  const pernyataan = new Map(berkas.map(b => {
    const sql = pecahSql(b.sql);
    if (!sql.length) throw new Error(`Migrasi kosong: ${b.nama}`);
    return [b.nomor, sql];
  }));
  const koneksi = await pool.getConnection();
  let kunci: string | undefined;
  try {
    kunci = await kunciMigrasi(koneksi);
    if (perintah === 'fresh') {
      const tabel = await daftarTabel(koneksi);
      await koneksi.query('SET FOREIGN_KEY_CHECKS = 0');
      try { for (const t of tabel) await hapusTabel(koneksi, t.nama); }
      finally { await koneksi.query('SET FOREIGN_KEY_CHECKS = 1'); }
    }
    await siapkanRiwayat(koneksi);
    const riwayat = await daftarRiwayat(koneksi);
    if (perintah === 'status') {
      const catatan = new Map(riwayat.map(r => [r.nomor, r]));
      for (const b of berkas) {
        const r = catatan.get(b.nomor);
        console.log(`${!r ? 'belum' : r.nama !== b.nama || r.checksum !== b.checksum ? 'berubah' : !r.selesai_pada ? 'gagal/belum selesai' : 'selesai'}\t${b.nama}`);
      }
      for (const r of riwayat) if (!berkas.some(b => b.nomor === r.nomor)) console.log(`hilang\t${r.nama}`);
      periksaRiwayat(berkas, riwayat);
      return;
    }
    periksaRiwayat(berkas, riwayat);
    const selesai = new Set(riwayat.map(r => r.nomor));
    for (const b of berkas) {
      if (selesai.has(b.nomor)) continue;
      await catatMulai(koneksi, b);
      for (const sql of pernyataan.get(b.nomor)!) await koneksi.query(sql);
      await catatSelesai(koneksi, b.nomor);
      console.log(`Diterapkan: ${b.nama}`);
    }
  } finally {
    try { if (kunci) await lepasKunci(koneksi, kunci); }
    finally { koneksi.release(); }
  }
}

if (require.main === module) {
  jalankanMigrasi(process.argv.slice(2))
    .catch(galat => { console.error(galat instanceof Error ? galat.message : 'Migrasi gagal.'); process.exitCode = 1; })
    .finally(tutupPool);
}
