import { tulis, pool } from '../../koneksi.js';
export async function ubahHasilPenunjangUntukPenunjangPenunjangIntegrasiTest(nilai, order_id, koneksi = pool) {
    const hasil = await tulis("UPDATE `hasil_penunjang` t SET `nilai` = IF(?, t.`nilai`, ?) WHERE ((? OR t.`order_id` <=> ?))", [nilai === undefined, nilai ?? null, order_id === undefined, order_id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export function hapusHasilPenunjangFasyankesUji(ids, koneksi = pool) {
    return tulis('DELETE FROM `hasil_penunjang` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
