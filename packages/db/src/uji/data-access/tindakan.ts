import { tulis, pool, type Koneksi } from '../../koneksi';


export function hapusTindakanFasyankesUji(ids: readonly number[], koneksi: Koneksi = pool) {
  return tulis('DELETE FROM `tindakan` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
