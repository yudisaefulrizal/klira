import { tulis, pool } from '../../koneksi.js';
export function hapusTelaahResepFasyankesUji(ids, koneksi = pool) {
    return tulis('DELETE FROM `telaah_resep` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
