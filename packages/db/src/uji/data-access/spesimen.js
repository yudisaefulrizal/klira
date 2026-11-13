import { tulis, pool } from '../../koneksi.js';
export function hapusSpesimenFasyankesUji(ids, koneksi = pool) {
    return tulis('DELETE FROM `spesimen` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
