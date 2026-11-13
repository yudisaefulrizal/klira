import { tulis, pool } from '../../koneksi.js';
export function hapusKebijakanRetensiFasyankesUji(ids, koneksi = pool) {
    return tulis('DELETE FROM `kebijakan_retensi` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
