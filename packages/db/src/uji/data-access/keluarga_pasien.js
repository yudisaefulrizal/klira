import { tulis, pool } from '../../koneksi.js';
export function hapusKeluargaPasienFasyankesUji(ids, koneksi = pool) {
    return tulis('DELETE FROM `keluarga_pasien` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
