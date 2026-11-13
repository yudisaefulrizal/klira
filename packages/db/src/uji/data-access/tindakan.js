import { tulis, pool } from '../../koneksi.js';
export function hapusTindakanFasyankesUji(ids, koneksi = pool) {
    return tulis('DELETE FROM `tindakan` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
