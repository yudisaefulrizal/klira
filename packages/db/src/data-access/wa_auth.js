import { baca, tulis, pool } from '../koneksi.js';
export async function hapusWaAuthUntukPutuskanDanBersihkan(koneksi = pool) {
    const hasil = await tulis("DELETE t FROM `wa_auth` t WHERE TRUE", [], koneksi);
    return { count: hasil.affectedRows };
}
export async function ambilWaAuthUntukBaca(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`isi` FROM `wa_auth` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function hapusWaAuthUntukSimpan(id, koneksi = pool) {
    const hasil = await tulis("DELETE t FROM `wa_auth` t WHERE ((? OR t.`id` <=> ?))", [id === undefined, id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function simpanWaAuthUntukSimpan(id, isi, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `wa_auth` (`id`, `isi`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `isi` = IF(?, `isi`, ?)", [(id === undefined ? null : id) ?? null, (isi === undefined ? null : isi) ?? null, isi === undefined, isi ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
