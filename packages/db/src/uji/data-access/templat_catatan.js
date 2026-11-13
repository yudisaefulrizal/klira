import { tulis, pool } from '../../koneksi.js';
export function hapusTemplatCatatanFasyankesUji(ids, koneksi = pool) {
    return tulis('DELETE FROM `templat_catatan` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
