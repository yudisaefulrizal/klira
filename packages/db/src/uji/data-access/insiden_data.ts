import { tulis, pool, type Koneksi } from '../../koneksi';

export function hapusInsidenDataFasyankesUji(ids: readonly number[], koneksi: Koneksi = pool) {
  return tulis('DELETE FROM `insiden_data` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
