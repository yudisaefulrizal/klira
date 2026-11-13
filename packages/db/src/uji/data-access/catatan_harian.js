import { tulis, pool } from '../../koneksi.js';
export function hapusCatatanHarianFasyankesUji(ids, koneksi = pool) {
    return tulis('DELETE FROM `catatan_harian` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
