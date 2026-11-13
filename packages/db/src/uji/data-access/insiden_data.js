import { tulis, pool } from '../../koneksi.js';
export function hapusInsidenDataFasyankesUji(ids, koneksi = pool) {
    return tulis('DELETE FROM `insiden_data` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
