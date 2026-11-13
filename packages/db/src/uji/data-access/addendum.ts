import { baca, tulis, pool, type Koneksi } from '../../koneksi';
import type * as T from '../../tipe';

export async function hitungAddendumUntukPenunjangPenunjangIntegrasiTest(fasyankes_id: number | undefined, koneksi: Koneksi = pool) {
  const [baris] = await baca<{ jumlah: string | number }>("SELECT COUNT(*) AS jumlah FROM `addendum` t WHERE ((? OR t.`fasyankes_id` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
  return Number(baris.jumlah);
}

export async function ubahAddendumUntukPenunjangPenunjangIntegrasiTest(isi: T.NilaiJson | undefined, id: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("UPDATE `addendum` t SET `isi` = IF(?, t.`isi`, ?) WHERE ((? OR t.`id` <=> ?))", [isi === undefined, JSON.stringify(isi ?? null), id === undefined, id ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export function hapusAddendumFasyankesUji(ids: readonly number[], koneksi: Koneksi = pool) {
  return tulis('DELETE FROM `addendum` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
