import { tulis, pool } from '../../koneksi.js';
export function hapusTindakLanjutFasyankesUji(ids, koneksi = pool) {
    return tulis('DELETE FROM `tindak_lanjut` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
