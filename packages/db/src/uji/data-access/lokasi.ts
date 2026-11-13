import { baca, tulis, pool, type Koneksi } from '../../koneksi';
import type * as T from '../../tipe';

export async function tambahLokasiUntukKlinisKlinisIntegrasiTest(fasyankes_id: number | undefined, nama: string | undefined, jenis: T.JenisLokasi | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `lokasi` (`fasyankes_id`, `nama`, `jenis`) VALUES (?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (nama === undefined ? null : nama) ?? null, ((jenis === undefined ? null : jenis) ?? null)], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function tambahLokasiUntukKlinisKlinisIntegrasiTestHasil(id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; nama: string; jenis: T.JenisLokasi; induk_id: number | null; status_operasional: T.StatusOperasional; ihs_location_id: string | null; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`nama`, t.`jenis`, t.`induk_id`, t.`status_operasional`, t.`ihs_location_id`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `lokasi` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
  if (!baris[0]) throw new Error('Baris lokasi tidak ditemukan.');
  return baris[0];
}

export async function hapusLokasiUntukKlinisKlinisIntegrasiTest(fasyankes_id: readonly (number)[] | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("DELETE t FROM `lokasi` t WHERE ((? OR t.`fasyankes_id` IN (?)))", [fasyankes_id === undefined, (fasyankes_id)?.length ? (fasyankes_id) : [null]], koneksi);
  return { count: hasil.affectedRows };
}

export async function ubahLokasiUntukMasterMasterIntegrasiTest(induk_id: number | null | undefined, fasyankes_id: readonly (number)[] | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("UPDATE `lokasi` t SET `induk_id` = IF(?, t.`induk_id`, ?) WHERE ((? OR t.`fasyankes_id` IN (?)))", [induk_id === undefined, induk_id ?? null, fasyankes_id === undefined, (fasyankes_id)?.length ? (fasyankes_id) : [null]], koneksi);
  return { count: hasil.affectedRows };
}

export async function hitungLokasiUntukMasterMasterIntegrasiTest(fasyankes_id: number | undefined, koneksi: Koneksi = pool) {
  const [baris] = await baca<{ jumlah: string | number }>("SELECT COUNT(*) AS jumlah FROM `lokasi` t WHERE ((? OR t.`fasyankes_id` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
  return Number(baris.jumlah);
}

export async function wajibLokasiUntukMasterMasterIntegrasiTest(fasyankes_id: number | undefined, nama: string | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; nama: string; jenis: T.JenisLokasi; induk_id: number | null; status_operasional: T.StatusOperasional; ihs_location_id: string | null; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`nama`, t.`jenis`, t.`induk_id`, t.`status_operasional`, t.`ihs_location_id`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `lokasi` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`nama` <=> ?)) LIMIT 1", [fasyankes_id === undefined, fasyankes_id ?? null, nama === undefined, nama ?? null], koneksi);
  if (!baris[0]) throw new Error('Baris lokasi tidak ditemukan.');
  return baris[0];
}

export async function wajibLokasiUntukMasterMasterIntegrasiTest3(fasyankes_id: number | undefined, jenis: T.JenisLokasi | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; nama: string; jenis: T.JenisLokasi; induk_id: number | null; status_operasional: T.StatusOperasional; ihs_location_id: string | null; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`nama`, t.`jenis`, t.`induk_id`, t.`status_operasional`, t.`ihs_location_id`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `lokasi` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`jenis` <=> ?)) LIMIT 1", [fasyankes_id === undefined, fasyankes_id ?? null, jenis === undefined, jenis ?? null], koneksi);
  if (!baris[0]) throw new Error('Baris lokasi tidak ditemukan.');
  return baris[0];
}

export async function tambahLokasiUntukPasienPasienIntegrasiTest3(fasyankes_id: number | undefined, nama: string | undefined, jenis: T.JenisLokasi | undefined, status_operasional: T.StatusOperasional | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `lokasi` (`fasyankes_id`, `nama`, `jenis`, `status_operasional`) VALUES (?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (nama === undefined ? null : nama) ?? null, ((jenis === undefined ? null : jenis) ?? null), ((status_operasional === undefined ? "O" : status_operasional) ?? null)], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function tambahLokasiUntukBuatLokasi(fasyankes_id: number | undefined, nama: string | undefined, jenis: T.JenisLokasi | undefined, induk_id: number | null | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `lokasi` (`fasyankes_id`, `nama`, `jenis`, `induk_id`) VALUES (?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (nama === undefined ? null : nama) ?? null, ((jenis === undefined ? null : jenis) ?? null), (induk_id === undefined ? null : induk_id) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function hapusLokasiUntukRawatInapRawatInapIntegrasiTest(fasyankes_id: readonly (number)[] | undefined, jenis: T.JenisLokasi | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("DELETE t FROM `lokasi` t WHERE ((? OR t.`fasyankes_id` IN (?))) AND ((? OR t.`jenis` <=> ?))", [fasyankes_id === undefined, (fasyankes_id)?.length ? (fasyankes_id) : [null], jenis === undefined, jenis ?? null], koneksi);
  return { count: hasil.affectedRows };
}

