import { tulis, pool } from '../../koneksi.js';
export function hapusPenarikanPersetujuanFasyankesUji(ids, koneksi = pool) {
    return tulis('DELETE FROM `penarikan_persetujuan` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
