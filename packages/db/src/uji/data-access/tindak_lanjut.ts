import { tulis, pool, type Koneksi } from '../../koneksi';


export function hapusTindakLanjutFasyankesUji(ids: readonly number[], koneksi: Koneksi = pool) {
  return tulis('DELETE FROM `tindak_lanjut` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
