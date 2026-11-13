import { baca, tulis, pool } from '../koneksi.js';
export async function daftarItemResepUntukCatatTelaah(resep_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`resep_id`, t.`master_obat_id`, t.`aturan_pakai`, t.`bentuk`, t.`rute`, t.`jumlah`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `item_resep` t WHERE ((? OR t.`resep_id` <=> ?)) ORDER BY t.`id` ASC", [resep_id === undefined, resep_id ?? null], koneksi);
    return baris;
}
export async function hapusItemResepUntukCatatTelaah(resep_id, koneksi = pool) {
    const hasil = await tulis("DELETE t FROM `item_resep` t WHERE ((? OR t.`resep_id` <=> ?))", [resep_id === undefined, resep_id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function tambahItemResepUntukCatatTelaah(fasyankes_id, resep_id, master_obat_id, aturan_pakai, bentuk, rute, jumlah, dibuat_oleh, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `item_resep` (`fasyankes_id`, `resep_id`, `master_obat_id`, `aturan_pakai`, `bentuk`, `rute`, `jumlah`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (resep_id === undefined ? null : resep_id) ?? null, (master_obat_id === undefined ? null : master_obat_id) ?? null, (aturan_pakai === undefined ? null : aturan_pakai) ?? null, (bentuk === undefined ? null : bentuk) ?? null, (rute === undefined ? null : rute) ?? null, (jumlah === undefined ? null : jumlah) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function tambahItemResepUntukCatatTelaahHasil(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`resep_id`, t.`master_obat_id`, t.`aturan_pakai`, t.`bentuk`, t.`rute`, t.`jumlah`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `item_resep` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    if (!baris[0])
        throw new Error('Baris item_resep tidak ditemukan.');
    return baris[0];
}
