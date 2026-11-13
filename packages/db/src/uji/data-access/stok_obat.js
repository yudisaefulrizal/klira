import { baca, tulis, pool } from '../../koneksi.js';
export async function cariStokObatUntukStokBatch(master_obat_id, batch, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`master_obat_id`, t.`batch`, t.`kedaluwarsa`, t.`jumlah`, t.`dibuat_oleh`, t.`dibuat_pada`, t.`diubah_pada` FROM `stok_obat` t WHERE ((? OR t.`master_obat_id` <=> ?)) AND ((? OR t.`batch` <=> ?)) LIMIT 1", [master_obat_id === undefined, master_obat_id ?? null, batch === undefined, batch ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function tambahStokObatUntukKasirKasirIntegrasiTest(fasyankes_id, master_obat_id, batch, kedaluwarsa, jumlah, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `stok_obat` (`fasyankes_id`, `master_obat_id`, `batch`, `kedaluwarsa`, `jumlah`) VALUES (?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (master_obat_id === undefined ? null : master_obat_id) ?? null, (batch === undefined ? null : batch) ?? null, (kedaluwarsa === undefined ? null : kedaluwarsa) ?? null, (jumlah === undefined ? 0 : jumlah) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function ubahStokObatUntukKasirKasirIntegrasiTest(jumlah, master_obat_id, batch, koneksi = pool) {
    const hasil = await tulis("UPDATE `stok_obat` t SET `jumlah` = IF(?, t.`jumlah`, ?) WHERE ((? OR t.`master_obat_id` <=> ?)) AND ((? OR t.`batch` <=> ?))", [jumlah === undefined, jumlah ?? null, master_obat_id === undefined, master_obat_id ?? null, batch === undefined, batch ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export function hapusStokObatFasyankesUji(ids, koneksi = pool) {
    return tulis('DELETE FROM `stok_obat` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
