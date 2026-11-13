import { tulis, pool, type Koneksi } from '../../koneksi';

export function hapusPenyampaianRmFasyankesUji(ids: readonly number[], koneksi: Koneksi = pool) {
  return tulis('DELETE FROM `penyampaian_rm` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
