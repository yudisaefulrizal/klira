import { tulis, pool } from '../../koneksi.js';
export async function tambahItemResepUntukSiapkan(fasyankes_id, resep_id, master_obat_id, aturan_pakai, jumlah, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `item_resep` (`fasyankes_id`, `resep_id`, `master_obat_id`, `aturan_pakai`, `jumlah`) VALUES (?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (resep_id === undefined ? null : resep_id) ?? null, (master_obat_id === undefined ? null : master_obat_id) ?? null, (aturan_pakai === undefined ? null : aturan_pakai) ?? null, (jumlah === undefined ? null : jumlah) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export function hapusItemResepFasyankesUji(ids, koneksi = pool) {
    return tulis('DELETE FROM `item_resep` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
