import { tulis, pool } from '../../koneksi.js';
export function hapusDpiaFasyankesUji(ids, koneksi = pool) {
    return tulis('DELETE FROM `dpia` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
