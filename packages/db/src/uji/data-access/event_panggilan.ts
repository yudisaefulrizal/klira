import { tulis, pool, type Koneksi } from '../../koneksi';
export async function hapusEventPanggilanFasyankesUji(ids: readonly number[], koneksi: Koneksi = pool) {
  const hasil = await tulis('DELETE FROM event_panggilan WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
  return { count: hasil.affectedRows };
}
