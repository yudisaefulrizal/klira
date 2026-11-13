import { tulis, pool, type Koneksi } from '../../koneksi';


export function hapusTemplatCatatanFasyankesUji(ids: readonly number[], koneksi: Koneksi = pool) {
  return tulis('DELETE FROM `templat_catatan` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
