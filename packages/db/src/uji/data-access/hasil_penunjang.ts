import { tulis, pool, type Koneksi } from '../../koneksi';


export async function ubahHasilPenunjangUntukPenunjangPenunjangIntegrasiTest(nilai: string | undefined, order_id: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("UPDATE `hasil_penunjang` t SET `nilai` = IF(?, t.`nilai`, ?) WHERE ((? OR t.`order_id` <=> ?))", [nilai === undefined, nilai ?? null, order_id === undefined, order_id ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export function hapusHasilPenunjangFasyankesUji(ids: readonly number[], koneksi: Koneksi = pool) {
  return tulis('DELETE FROM `hasil_penunjang` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
