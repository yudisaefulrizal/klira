import { tulis, pool, type Koneksi } from '../../koneksi';

export function hapusPemusnahanFasyankesUji(ids: readonly number[], koneksi: Koneksi = pool) {
  return tulis('DELETE FROM `pemusnahan` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
