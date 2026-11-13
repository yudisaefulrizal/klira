import { baca, tulis, pool, type Koneksi } from '../koneksi';


export async function ubahStokObatUntukSerahTerima(jumlah: number | undefined, diubah_pada: Date | null | undefined, id: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("UPDATE `stok_obat` t SET `jumlah` = IF(?, t.`jumlah`, t.`jumlah` - ?), `diubah_pada` = IF(?, t.`diubah_pada`, ?) WHERE ((? OR t.`id` <=> ?))", [jumlah === undefined, jumlah ?? null, diubah_pada === undefined, diubah_pada ?? null, id === undefined, id ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export async function daftarStokObatUntukRingkasStok(fasyankes_id: number | undefined, master_obat_id: readonly (number)[] | undefined, jumlah: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; master_obat_id: number; batch: string; kedaluwarsa: Date; jumlah: number; dibuat_oleh: number | null; dibuat_pada: Date; diubah_pada: Date | null }>("SELECT t.`id`, t.`fasyankes_id`, t.`master_obat_id`, t.`batch`, t.`kedaluwarsa`, t.`jumlah`, t.`dibuat_oleh`, t.`dibuat_pada`, t.`diubah_pada` FROM `stok_obat` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`master_obat_id` IN (?))) AND ((? OR t.`jumlah` > ?)) ORDER BY t.`kedaluwarsa` ASC", [fasyankes_id === undefined, fasyankes_id ?? null, master_obat_id === undefined, (master_obat_id)?.length ? (master_obat_id) : [null], jumlah === undefined, jumlah ?? null], koneksi);
  return baris;
}

export async function daftarStokObatUntukStokMaster(fasyankes_id: number | undefined, master_obat_id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; master_obat_id: number; batch: string; kedaluwarsa: Date; jumlah: number; dibuat_oleh: number | null; dibuat_pada: Date; diubah_pada: Date | null }>("SELECT t.`id`, t.`fasyankes_id`, t.`master_obat_id`, t.`batch`, t.`kedaluwarsa`, t.`jumlah`, t.`dibuat_oleh`, t.`dibuat_pada`, t.`diubah_pada` FROM `stok_obat` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`master_obat_id` <=> ?)) ORDER BY t.`kedaluwarsa` ASC, t.`batch` ASC", [fasyankes_id === undefined, fasyankes_id ?? null, master_obat_id === undefined, master_obat_id ?? null], koneksi);
  return baris;
}

export async function ubahStokObatUntukMutasi(kedaluwarsa: Date | undefined, jumlah: number | undefined, diubah_pada: Date | null | undefined, id: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("UPDATE `stok_obat` t SET `kedaluwarsa` = IF(?, t.`kedaluwarsa`, ?), `jumlah` = IF(?, t.`jumlah`, ?), `diubah_pada` = IF(?, t.`diubah_pada`, ?) WHERE ((? OR t.`id` <=> ?))", [kedaluwarsa === undefined, kedaluwarsa ?? null, jumlah === undefined, jumlah ?? null, diubah_pada === undefined, diubah_pada ?? null, id === undefined, id ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export async function tambahStokObatUntukMutasi(fasyankes_id: number | undefined, master_obat_id: number | undefined, batch: string | undefined, kedaluwarsa: Date | undefined, jumlah: number | undefined, dibuat_oleh: number | null | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `stok_obat` (`fasyankes_id`, `master_obat_id`, `batch`, `kedaluwarsa`, `jumlah`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (master_obat_id === undefined ? null : master_obat_id) ?? null, (batch === undefined ? null : batch) ?? null, (kedaluwarsa === undefined ? null : kedaluwarsa) ?? null, (jumlah === undefined ? 0 : jumlah) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function tambahStokObatUntukMutasiHasil(id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; master_obat_id: number; batch: string; kedaluwarsa: Date; jumlah: number; dibuat_oleh: number | null; dibuat_pada: Date; diubah_pada: Date | null }>("SELECT t.`id`, t.`fasyankes_id`, t.`master_obat_id`, t.`batch`, t.`kedaluwarsa`, t.`jumlah`, t.`dibuat_oleh`, t.`dibuat_pada`, t.`diubah_pada` FROM `stok_obat` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
  if (!baris[0]) throw new Error('Baris stok_obat tidak ditemukan.');
  return baris[0];
}

export async function ubahStokObatUntukMutasi2(jumlah: number | undefined, diubah_pada: Date | null | undefined, id: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("UPDATE `stok_obat` t SET `jumlah` = IF(?, t.`jumlah`, ?), `diubah_pada` = IF(?, t.`diubah_pada`, ?) WHERE ((? OR t.`id` <=> ?))", [jumlah === undefined, jumlah ?? null, diubah_pada === undefined, diubah_pada ?? null, id === undefined, id ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export async function kunciStokObatTersedia(obatId: number, fasyankesId: number, tanggal: Date, koneksi: Koneksi = pool) {
  return baca<{ id: number; jumlah: number }>("SELECT id, jumlah FROM stok_obat WHERE master_obat_id = ? AND fasyankes_id = ? AND jumlah > 0 AND kedaluwarsa >= ? ORDER BY kedaluwarsa, batch FOR UPDATE", [obatId, fasyankesId, tanggal], koneksi);
}

export async function kunciBatchStokObat(obatId: number, batch: string, fasyankesId: number, koneksi: Koneksi = pool) {
  return baca<{ id: number; jumlah: number }>("SELECT id, jumlah FROM stok_obat WHERE master_obat_id = ? AND batch = ? AND fasyankes_id = ? FOR UPDATE", [obatId, batch, fasyankesId], koneksi);
}
