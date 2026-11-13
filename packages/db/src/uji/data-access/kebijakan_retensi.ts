import { tulis, pool, type Koneksi } from '../../koneksi';

export function hapusKebijakanRetensiFasyankesUji(ids: readonly number[], koneksi: Koneksi = pool) {
  return tulis('DELETE FROM `kebijakan_retensi` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
