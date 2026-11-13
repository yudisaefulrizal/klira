import { tulis, pool } from '../../koneksi.js';
export function hapusPemulanganFasyankesUji(ids, koneksi = pool) {
    return tulis('DELETE FROM `pemulangan` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
