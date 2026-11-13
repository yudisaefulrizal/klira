import { tulis, pool, type Koneksi } from '../../koneksi';


export function hapusKeluargaPasienFasyankesUji(ids: readonly number[], koneksi: Koneksi = pool) {
  return tulis('DELETE FROM `keluarga_pasien` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
