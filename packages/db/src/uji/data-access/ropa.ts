import { tulis, pool, type Koneksi } from '../../koneksi';

export function hapusRopaFasyankesUji(ids: readonly number[], koneksi: Koneksi = pool) {
  return tulis('DELETE FROM `ropa` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
