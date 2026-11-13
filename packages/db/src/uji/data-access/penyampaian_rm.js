import { tulis, pool } from '../../koneksi.js';
export function hapusPenyampaianRmFasyankesUji(ids, koneksi = pool) {
    return tulis('DELETE FROM `penyampaian_rm` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
