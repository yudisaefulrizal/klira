import { tulis, pool, type Koneksi } from '../../koneksi';

export function hapusPembukaanRmFasyankesUji(ids: readonly number[], koneksi: Koneksi = pool) {
  return tulis('DELETE FROM `pembukaan_rm` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
