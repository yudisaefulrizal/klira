import { tulis, pool } from '../../koneksi.js';
export function hapusInsidenPasienFasyankesUji(ids, koneksi = pool) {
    return tulis('DELETE FROM `insiden_pasien` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
