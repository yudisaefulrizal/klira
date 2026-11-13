import { tulis, pool, type Koneksi } from '../../koneksi';

export function hapusSuratFasyankesUji(ids: readonly number[], koneksi: Koneksi = pool) {
  return tulis('DELETE FROM `surat` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
