import { tulis, pool, type Koneksi } from '../../koneksi';

export function hapusProsesorDataFasyankesUji(ids: readonly number[], koneksi: Koneksi = pool) {
  return tulis('DELETE FROM `prosesor_data` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
