import { tulis, pool } from '../../koneksi.js';
export function hapusOrderPenunjangFasyankesUji(ids, koneksi = pool) {
    return tulis('DELETE FROM `order_penunjang` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
