import { tulis, pool } from '../../koneksi.js';
export function hapusPemusnahanFasyankesUji(ids, koneksi = pool) {
    return tulis('DELETE FROM `pemusnahan` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
