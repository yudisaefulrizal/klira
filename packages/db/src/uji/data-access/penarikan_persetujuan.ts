import { tulis, pool, type Koneksi } from '../../koneksi';

export function hapusPenarikanPersetujuanFasyankesUji(ids: readonly number[], koneksi: Koneksi = pool) {
  return tulis('DELETE FROM `penarikan_persetujuan` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
