import { baca, tulis, pool } from '../koneksi.js';
import { wajibId } from '../wajib.js';
export async function ubahStokObatUntukSerahTerima(jumlah, diubah_pada, id, koneksi = pool) {
    wajibId('ubahStokObatUntukSerahTerima', id);
    const hasil = await tulis("UPDATE `stok_obat` t SET `jumlah` = IF(?, t.`jumlah`, t.`jumlah` - ?), `diubah_pada` = IF(?, t.`diubah_pada`, ?) WHERE ((? OR t.`id` <=> ?))", [jumlah === undefined, jumlah ?? null, diubah_pada === undefined, diubah_pada ?? null, id === undefined, id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function daftarStokObatUntukRingkasStok(master_obat_id, jumlah, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`master_obat_id`, t.`batch`, t.`kedaluwarsa`, t.`jumlah`, t.`dibuat_oleh`, t.`dibuat_pada`, t.`diubah_pada` FROM `stok_obat` t WHERE ((? OR t.`master_obat_id` IN (?))) AND ((? OR t.`jumlah` > ?)) ORDER BY t.`kedaluwarsa` ASC", [master_obat_id === undefined, (master_obat_id)?.length ? (master_obat_id) : [null], jumlah === undefined, jumlah ?? null], koneksi);
    return baris;
}
export async function daftarStokObatUntukStokMaster(master_obat_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`master_obat_id`, t.`batch`, t.`kedaluwarsa`, t.`jumlah`, t.`dibuat_oleh`, t.`dibuat_pada`, t.`diubah_pada` FROM `stok_obat` t WHERE ((? OR t.`master_obat_id` <=> ?)) ORDER BY t.`kedaluwarsa` ASC, t.`batch` ASC", [master_obat_id === undefined, master_obat_id ?? null], koneksi);
    return baris;
}
export async function ubahStokObatUntukMutasi(kedaluwarsa, jumlah, diubah_pada, id, koneksi = pool) {
    wajibId('ubahStokObatUntukMutasi', id);
    const hasil = await tulis("UPDATE `stok_obat` t SET `kedaluwarsa` = IF(?, t.`kedaluwarsa`, ?), `jumlah` = IF(?, t.`jumlah`, ?), `diubah_pada` = IF(?, t.`diubah_pada`, ?) WHERE ((? OR t.`id` <=> ?))", [kedaluwarsa === undefined, kedaluwarsa ?? null, jumlah === undefined, jumlah ?? null, diubah_pada === undefined, diubah_pada ?? null, id === undefined, id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function tambahStokObatUntukMutasi(master_obat_id, batch, kedaluwarsa, jumlah, dibuat_oleh, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `stok_obat` (`master_obat_id`, `batch`, `kedaluwarsa`, `jumlah`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?)", [(master_obat_id === undefined ? null : master_obat_id) ?? null, (batch === undefined ? null : batch) ?? null, (kedaluwarsa === undefined ? null : kedaluwarsa) ?? null, (jumlah === undefined ? 0 : jumlah) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function tambahStokObatUntukMutasiHasil(id, koneksi = pool) {
    wajibId('tambahStokObatUntukMutasiHasil', id);
    const baris = await baca("SELECT t.`id`, t.`master_obat_id`, t.`batch`, t.`kedaluwarsa`, t.`jumlah`, t.`dibuat_oleh`, t.`dibuat_pada`, t.`diubah_pada` FROM `stok_obat` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    if (!baris[0])
        throw new Error('Baris stok_obat tidak ditemukan.');
    return baris[0];
}
export async function ubahStokObatUntukMutasi2(jumlah, diubah_pada, id, koneksi = pool) {
    wajibId('ubahStokObatUntukMutasi2', id);
    const hasil = await tulis("UPDATE `stok_obat` t SET `jumlah` = IF(?, t.`jumlah`, ?), `diubah_pada` = IF(?, t.`diubah_pada`, ?) WHERE ((? OR t.`id` <=> ?))", [jumlah === undefined, jumlah ?? null, diubah_pada === undefined, diubah_pada ?? null, id === undefined, id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function kunciStokObatTersedia(obatId, tanggal, koneksi = pool) {
    return baca("SELECT id, jumlah FROM stok_obat WHERE master_obat_id = ? AND jumlah > 0 AND kedaluwarsa >= ? ORDER BY kedaluwarsa, batch FOR UPDATE", [obatId, tanggal], koneksi);
}
export async function kunciBatchStokObat(obatId, batch, koneksi = pool) {
    return baca("SELECT id, jumlah FROM stok_obat WHERE master_obat_id = ? AND batch = ? FOR UPDATE", [obatId, batch], koneksi);
}
