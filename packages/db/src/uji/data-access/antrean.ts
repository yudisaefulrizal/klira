import { baca, tulis, pool, type Koneksi } from '../../koneksi';
import type * as T from '../../tipe';

export async function tambahAntreanUntukKlinisKlinisIntegrasiTest(fasyankes_id: number | undefined, kunjungan_id: number | undefined, lokasi_id: number | undefined, tanggal: Date | undefined, nomor: number | undefined, status: T.StatusAntrean | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `antrean` (`fasyankes_id`, `kunjungan_id`, `lokasi_id`, `tanggal`, `nomor`, `status`) VALUES (?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (kunjungan_id === undefined ? null : kunjungan_id) ?? null, (lokasi_id === undefined ? null : lokasi_id) ?? null, (tanggal === undefined ? null : tanggal) ?? null, (nomor === undefined ? null : nomor) ?? null, ((status === undefined ? "menunggu" : status) ?? null)], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function hapusAntreanUntukKlinisKlinisIntegrasiTest(fasyankes_id: readonly (number)[] | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("DELETE t FROM `antrean` t WHERE ((? OR t.`fasyankes_id` IN (?)))", [fasyankes_id === undefined, (fasyankes_id)?.length ? (fasyankes_id) : [null]], koneksi);
  return { count: hasil.affectedRows };
}

export async function wajibAntreanUntukKlinisKlinisIntegrasiTest(kunjungan_id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; kunjungan_id: number; lokasi_id: number; tanggal: Date; nomor: number; status: T.StatusAntrean; waktu_daftar: Date; waktu_panggil: Date | null; waktu_mulai: Date | null; waktu_selesai: Date | null; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`lokasi_id`, t.`tanggal`, t.`nomor`, t.`status`, t.`waktu_daftar`, t.`waktu_panggil`, t.`waktu_mulai`, t.`waktu_selesai`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `antrean` t WHERE ((? OR t.`kunjungan_id` <=> ?)) LIMIT 1", [kunjungan_id === undefined, kunjungan_id ?? null], koneksi);
  if (!baris[0]) throw new Error('Baris antrean tidak ditemukan.');
  return baris[0];
}

export async function wajibAntreanUntukPasienPasienIntegrasiTest(id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; kunjungan_id: number; lokasi_id: number; tanggal: Date; nomor: number; status: T.StatusAntrean; waktu_daftar: Date; waktu_panggil: Date | null; waktu_mulai: Date | null; waktu_selesai: Date | null; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`lokasi_id`, t.`tanggal`, t.`nomor`, t.`status`, t.`waktu_daftar`, t.`waktu_panggil`, t.`waktu_mulai`, t.`waktu_selesai`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `antrean` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
  if (!baris[0]) throw new Error('Baris antrean tidak ditemukan.');
  return baris[0];
}

export function hapusAntreanFasyankesUji(ids: readonly number[], koneksi: Koneksi = pool) {
  return tulis('DELETE FROM `antrean` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
