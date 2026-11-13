import { tulis, pool, type Koneksi } from '../../koneksi';


export function hapusFavoritDokterFasyankesUji(ids: readonly number[], koneksi: Koneksi = pool) {
  return tulis('DELETE FROM `favorit_dokter` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
