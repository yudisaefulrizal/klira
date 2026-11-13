import { tulis, pool } from '../../koneksi.js';
export function hapusPembukaanRmFasyankesUji(ids, koneksi = pool) {
    return tulis('DELETE FROM `pembukaan_rm` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
