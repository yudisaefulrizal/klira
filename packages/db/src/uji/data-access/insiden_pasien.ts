import { tulis, pool, type Koneksi } from '../../koneksi';

export function hapusInsidenPasienFasyankesUji(ids: readonly number[], koneksi: Koneksi = pool) {
  return tulis('DELETE FROM `insiden_pasien` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
