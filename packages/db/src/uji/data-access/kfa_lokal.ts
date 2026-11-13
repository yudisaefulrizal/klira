import { tulis, pool, type Koneksi } from '../../koneksi';
import type * as T from '../../tipe';


export async function tambahBanyakKfaLokalUntukFarmasiFarmasiIntegrasiTest(data: readonly T.KfaLokalBaru[], koneksi: Koneksi = pool) {
  if (!data.length) return { count: 0 };
  const nilai = data.map(d => [(d.fasyankes_id === undefined ? null : d.fasyankes_id) ?? null, (d.kode === undefined ? null : d.kode) ?? null, (d.nama === undefined ? null : d.nama) ?? null, (d.bentuk_sediaan === undefined ? null : d.bentuk_sediaan) ?? null, (d.satuan === undefined ? null : d.satuan) ?? null, (d.status === undefined ? "aktif" : d.status) ?? null, (d.dibuat_oleh === undefined ? null : d.dibuat_oleh) ?? null, (d.dibuat_pada === undefined ? new Date() : d.dibuat_pada) ?? null, (d.diubah_pada === undefined ? null : d.diubah_pada) ?? null]);
  const hasil = await tulis("INSERT INTO `kfa_lokal` (`fasyankes_id`, `kode`, `nama`, `bentuk_sediaan`, `satuan`, `status`, `dibuat_oleh`, `dibuat_pada`, `diubah_pada`) VALUES ?", [nilai], koneksi);
  return { count: hasil.affectedRows };
}

export async function hapusKfaLokalUntukFarmasiFarmasiIntegrasiTest(fasyankes_id: readonly (number)[] | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("DELETE t FROM `kfa_lokal` t WHERE ((? OR t.`fasyankes_id` IN (?)))", [fasyankes_id === undefined, (fasyankes_id)?.length ? (fasyankes_id) : [null]], koneksi);
  return { count: hasil.affectedRows };
}
