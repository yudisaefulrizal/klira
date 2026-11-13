import { baca, tulis, pool, type Koneksi } from '../../koneksi';
import type * as T from '../../tipe';

export async function tambahResepUntukSiapkan(fasyankes_id: number | undefined, kunjungan_id: number | undefined, dpjp_id: number | undefined, nomor_resep: string | undefined, teks: string | undefined, status: T.StatusResep | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `resep` (`fasyankes_id`, `kunjungan_id`, `dpjp_id`, `nomor_resep`, `teks`, `status`) VALUES (?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (kunjungan_id === undefined ? null : kunjungan_id) ?? null, (dpjp_id === undefined ? null : dpjp_id) ?? null, (nomor_resep === undefined ? null : nomor_resep) ?? null, (teks === undefined ? null : teks) ?? null, ((status === undefined ? "diajukan" : status) ?? null)], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function tambahResepUntukSiapkanHasil(id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; kunjungan_id: number; dpjp_id: number; nomor_resep: string; teks: string; jenis_pembiayaan: T.CaraPembayaran; status: T.StatusResep; waktu_siap: Date | null; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`dpjp_id`, t.`nomor_resep`, t.`teks`, t.`jenis_pembiayaan`, t.`status`, t.`waktu_siap`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `resep` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
  if (!baris[0]) throw new Error('Baris resep tidak ditemukan.');
  return baris[0];
}

export async function ambilResepUntukKasirKasirIntegrasiTest(id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; kunjungan_id: number; dpjp_id: number; nomor_resep: string; teks: string; jenis_pembiayaan: T.CaraPembayaran; status: T.StatusResep; waktu_siap: Date | null; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`dpjp_id`, t.`nomor_resep`, t.`teks`, t.`jenis_pembiayaan`, t.`status`, t.`waktu_siap`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `resep` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
  return (baris[0] ?? null) as (typeof baris)[number] | null;
}

export function hapusResepFasyankesUji(ids: readonly number[], koneksi: Koneksi = pool) {
  return tulis('DELETE FROM `resep` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
