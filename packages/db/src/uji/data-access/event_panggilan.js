import { tulis, pool } from '../../koneksi.js';
export async function hapusEventPanggilanFasyankesUji(ids, koneksi = pool) {
    const hasil = await tulis('DELETE FROM event_panggilan WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
    return { count: hasil.affectedRows };
}
