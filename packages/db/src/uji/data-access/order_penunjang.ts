import { tulis, pool, type Koneksi } from '../../koneksi';

export function hapusOrderPenunjangFasyankesUji(ids: readonly number[], koneksi: Koneksi = pool) {
  return tulis('DELETE FROM `order_penunjang` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
