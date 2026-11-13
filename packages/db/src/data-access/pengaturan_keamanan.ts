import { baca, tulis, pool, type Koneksi } from '../koneksi';


export async function ambilPengaturanKeamananUntukAmbilPengaturan(fasyankes_id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ masa_sesi_jam: number; batas_percobaan_masuk: number; panjang_minimum_kata_sandi: number; diubah_pada: Date }>("SELECT t.`masa_sesi_jam`, t.`batas_percobaan_masuk`, t.`panjang_minimum_kata_sandi`, t.`diubah_pada` FROM `pengaturan_keamanan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) LIMIT 1", [fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
  return (baris[0] ?? null) as (typeof baris)[number] | null;
}

export async function simpanPengaturanKeamananUntukSimpanPengaturan(fasyankes_id: number | undefined, masa_sesi_jam: number | undefined, batas_percobaan_masuk: number | undefined, panjang_minimum_kata_sandi: number | undefined, diubah_oleh: number | null | undefined, diubah_pada: Date | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `pengaturan_keamanan` (`fasyankes_id`, `masa_sesi_jam`, `batas_percobaan_masuk`, `panjang_minimum_kata_sandi`, `diubah_oleh`, `dibuat_oleh`, `diubah_pada`) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE `masa_sesi_jam` = IF(?, `masa_sesi_jam`, ?), `batas_percobaan_masuk` = IF(?, `batas_percobaan_masuk`, ?), `panjang_minimum_kata_sandi` = IF(?, `panjang_minimum_kata_sandi`, ?), `diubah_oleh` = IF(?, `diubah_oleh`, ?), `diubah_pada` = IF(?, `diubah_pada`, ?), `id` = LAST_INSERT_ID(`id`)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (masa_sesi_jam === undefined ? 12 : masa_sesi_jam) ?? null, (batas_percobaan_masuk === undefined ? 5 : batas_percobaan_masuk) ?? null, (panjang_minimum_kata_sandi === undefined ? 8 : panjang_minimum_kata_sandi) ?? null, (diubah_oleh === undefined ? null : diubah_oleh) ?? null, (diubah_oleh === undefined ? null : diubah_oleh) ?? null, (diubah_pada === undefined ? new Date() : diubah_pada) ?? null, masa_sesi_jam === undefined, masa_sesi_jam ?? null, batas_percobaan_masuk === undefined, batas_percobaan_masuk ?? null, panjang_minimum_kata_sandi === undefined, panjang_minimum_kata_sandi ?? null, diubah_oleh === undefined, diubah_oleh ?? null, diubah_pada === undefined, diubah_pada ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function simpanPengaturanKeamananUntukSimpanPengaturanHasil(fasyankes_id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ masa_sesi_jam: number; batas_percobaan_masuk: number; panjang_minimum_kata_sandi: number; diubah_pada: Date }>("SELECT t.`masa_sesi_jam`, t.`batas_percobaan_masuk`, t.`panjang_minimum_kata_sandi`, t.`diubah_pada` FROM `pengaturan_keamanan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) LIMIT 1", [fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
  if (!baris[0]) throw new Error('Baris pengaturan_keamanan tidak ditemukan.');
  return baris[0];
}
