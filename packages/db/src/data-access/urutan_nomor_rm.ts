import { baca, tulis, pool, type Koneksi } from '../koneksi';


export async function tambahUrutanNomorRmUntukDaftarkan(fasyankes_id: number | undefined, terakhir: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `urutan_nomor_rm` (`fasyankes_id`, `terakhir`) VALUES (?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (terakhir === undefined ? 0 : terakhir) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function ubahUrutanNomorRmUntukDaftarkan(terakhir: number | undefined, fasyankes_id: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("UPDATE `urutan_nomor_rm` t SET `terakhir` = IF(?, t.`terakhir`, t.`terakhir` + ?) WHERE ((? OR t.`fasyankes_id` <=> ?))", [terakhir === undefined, terakhir ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export async function ubahUrutanNomorRmUntukDaftarkanHasil(fasyankes_id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; terakhir: number; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`terakhir`, t.`dibuat_pada` FROM `urutan_nomor_rm` t WHERE ((? OR t.`fasyankes_id` <=> ?)) LIMIT 1", [fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
  if (!baris[0]) throw new Error('Baris urutan_nomor_rm tidak ditemukan.');
  return baris[0];
}
