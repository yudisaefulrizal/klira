import { tulis, pool } from '../../koneksi.js';
export function hapusFavoritDokterFasyankesUji(ids, koneksi = pool) {
    return tulis('DELETE FROM `favorit_dokter` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
