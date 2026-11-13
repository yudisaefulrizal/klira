import { tulis, pool, type Koneksi } from '../../koneksi';

export function hapusCatatanHarianFasyankesUji(ids: readonly number[], koneksi: Koneksi = pool) {
  return tulis('DELETE FROM `catatan_harian` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
