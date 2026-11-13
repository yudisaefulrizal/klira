import { tulis, pool } from '../../koneksi.js';
export function hapusRopaFasyankesUji(ids, koneksi = pool) {
    return tulis('DELETE FROM `ropa` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
