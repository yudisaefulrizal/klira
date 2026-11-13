import { tulis, pool } from '../../koneksi.js';
export function hapusProsesorDataFasyankesUji(ids, koneksi = pool) {
    return tulis('DELETE FROM `prosesor_data` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
