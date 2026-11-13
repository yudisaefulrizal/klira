import { baca, tulis, pool, type Koneksi } from '../../koneksi';
import type * as T from '../../tipe';

export async function tambahTagihanUntukSiapkan(fasyankes_id: number | undefined, kunjungan_id: number | undefined, status_tagihan: T.StatusTagihan | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `tagihan` (`fasyankes_id`, `kunjungan_id`, `status_tagihan`) VALUES (?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (kunjungan_id === undefined ? null : kunjungan_id) ?? null, ((status_tagihan === undefined ? "belum_lengkap" : status_tagihan) ?? null)], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function tambahTagihanUntukSiapkanHasil(id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; kunjungan_id: number; status_tagihan: T.StatusTagihan; status_pembayaran: T.StatusPembayaran; dibuat_oleh: number | null; dibuat_pada: Date; alasan_tutup_belum_lunas: string | null }>("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`status_tagihan`, t.`status_pembayaran`, t.`dibuat_oleh`, t.`dibuat_pada`, t.`alasan_tutup_belum_lunas` FROM `tagihan` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
  if (!baris[0]) throw new Error('Baris tagihan tidak ditemukan.');
  return baris[0];
}

export async function ambilTagihanUntukKasirKasirIntegrasiTest(kunjungan_id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; kunjungan_id: number; status_tagihan: T.StatusTagihan; status_pembayaran: T.StatusPembayaran; dibuat_oleh: number | null; dibuat_pada: Date; alasan_tutup_belum_lunas: string | null }>("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`status_tagihan`, t.`status_pembayaran`, t.`dibuat_oleh`, t.`dibuat_pada`, t.`alasan_tutup_belum_lunas` FROM `tagihan` t WHERE ((? OR t.`kunjungan_id` <=> ?)) LIMIT 1", [kunjungan_id === undefined, kunjungan_id ?? null], koneksi);
  return (baris[0] ?? null) as (typeof baris)[number] | null;
}

export async function wajibTagihanUntukKasirKasirIntegrasiTest(kunjungan_id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; kunjungan_id: number; status_tagihan: T.StatusTagihan; status_pembayaran: T.StatusPembayaran; dibuat_oleh: number | null; dibuat_pada: Date; alasan_tutup_belum_lunas: string | null }>("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`status_tagihan`, t.`status_pembayaran`, t.`dibuat_oleh`, t.`dibuat_pada`, t.`alasan_tutup_belum_lunas` FROM `tagihan` t WHERE ((? OR t.`kunjungan_id` <=> ?)) LIMIT 1", [kunjungan_id === undefined, kunjungan_id ?? null], koneksi);
  if (!baris[0]) throw new Error('Baris tagihan tidak ditemukan.');
  return baris[0];
}

export async function hitungTagihanUntukPenunjangPenunjangIntegrasiTest(kunjungan_id: number | undefined, koneksi: Koneksi = pool) {
  const [baris] = await baca<{ jumlah: string | number }>("SELECT COUNT(*) AS jumlah FROM `tagihan` t WHERE ((? OR t.`kunjungan_id` <=> ?))", [kunjungan_id === undefined, kunjungan_id ?? null], koneksi);
  return Number(baris.jumlah);
}

export async function hapusTagihanUntukRawatInapRawatInapIntegrasiTest(fasyankes_id: readonly (number)[] | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("DELETE t FROM `tagihan` t WHERE ((? OR t.`fasyankes_id` IN (?)))", [fasyankes_id === undefined, (fasyankes_id)?.length ? (fasyankes_id) : [null]], koneksi);
  return { count: hasil.affectedRows };
}

export async function tambahTagihanUntukRawatInapRawatInapIntegrasiTest(fasyankes_id: number | undefined, kunjungan_id: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `tagihan` (`fasyankes_id`, `kunjungan_id`) VALUES (?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (kunjungan_id === undefined ? null : kunjungan_id) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export function hapusTagihanFasyankesUji(ids: readonly number[], koneksi: Koneksi = pool) {
  return tulis('DELETE FROM `tagihan` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
