import { tulis, pool, type Koneksi } from '../../koneksi';
import type * as T from '../../tipe';


export async function tambahNarasiKlinisUntukKlaimKlaimIntegrasiTest(fasyankes_id: number | undefined, kunjungan_id: number | undefined, bagian: T.BagianNarasi | undefined, isi: string | null | undefined, versi: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `narasi_klinis` (`fasyankes_id`, `kunjungan_id`, `bagian`, `isi`, `versi`) VALUES (?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (kunjungan_id === undefined ? null : kunjungan_id) ?? null, ((bagian === undefined ? null : bagian) ?? null), (isi === undefined ? null : isi) ?? null, (versi === undefined ? null : versi) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export function hapusNarasiKlinisFasyankesUji(ids: readonly number[], koneksi: Koneksi = pool) {
  return tulis('DELETE FROM `narasi_klinis` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
