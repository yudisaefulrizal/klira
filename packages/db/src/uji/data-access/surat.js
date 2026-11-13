import { tulis, pool } from '../../koneksi.js';
export function hapusSuratFasyankesUji(ids, koneksi = pool) {
    return tulis('DELETE FROM `surat` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
