import { tulis, pool, type Koneksi } from '../../koneksi';

export function hapusTelaahResepFasyankesUji(ids: readonly number[], koneksi: Koneksi = pool) {
  return tulis('DELETE FROM `telaah_resep` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
