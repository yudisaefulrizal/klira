import { baca, tulis, pool } from '../../koneksi.js';
export async function hitungAddendumUntukPenunjangPenunjangIntegrasiTest(fasyankes_id, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `addendum` t WHERE ((? OR t.`fasyankes_id` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function ubahAddendumUntukPenunjangPenunjangIntegrasiTest(isi, id, koneksi = pool) {
    const hasil = await tulis("UPDATE `addendum` t SET `isi` = IF(?, t.`isi`, ?) WHERE ((? OR t.`id` <=> ?))", [isi === undefined, JSON.stringify(isi ?? null), id === undefined, id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export function hapusAddendumFasyankesUji(ids, koneksi = pool) {
    return tulis('DELETE FROM `addendum` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
