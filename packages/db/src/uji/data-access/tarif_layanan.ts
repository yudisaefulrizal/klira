import { baca, tulis, pool, type Koneksi } from '../../koneksi';
import type * as T from '../../tipe';

export async function hapusTarifLayananUntukMasterMasterIntegrasiTest(fasyankes_id: readonly (number)[] | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("DELETE t FROM `tarif_layanan` t WHERE ((? OR t.`fasyankes_id` IN (?)))", [fasyankes_id === undefined, (fasyankes_id)?.length ? (fasyankes_id) : [null]], koneksi);
  return { count: hasil.affectedRows };
}

export async function tambahTarifLayananUntukPenunjangPenunjangIntegrasiTest(fasyankes_id: number | undefined, kode: string | undefined, nama: string | undefined, jenis: T.JenisTarif | undefined, harga_umum: number | null | undefined, harga_jkn: number | null | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `tarif_layanan` (`fasyankes_id`, `kode`, `nama`, `jenis`, `harga_umum`, `harga_jkn`) VALUES (?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (kode === undefined ? null : kode) ?? null, (nama === undefined ? null : nama) ?? null, ((jenis === undefined ? null : jenis) ?? null), (harga_umum === undefined ? null : harga_umum) ?? null, (harga_jkn === undefined ? null : harga_jkn) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function tambahTarifLayananUntukPenunjangPenunjangIntegrasiTestHasil(id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; kode: string; nama: string; jenis: T.JenisTarif; harga_umum: number | null; harga_jkn: number | null; kode_icd9cm: string | null; aktif: boolean; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`kode`, t.`nama`, t.`jenis`, t.`harga_umum`, t.`harga_jkn`, t.`kode_icd9cm`, t.`aktif`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `tarif_layanan` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
  if (!baris[0]) throw new Error('Baris tarif_layanan tidak ditemukan.');
  return baris[0];
}

export async function wajibTarifLayananUntukPenunjangPenunjangIntegrasiTest(fasyankes_id: number | undefined, kode: string | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; kode: string; nama: string; jenis: T.JenisTarif; harga_umum: number | null; harga_jkn: number | null; kode_icd9cm: string | null; aktif: boolean; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`kode`, t.`nama`, t.`jenis`, t.`harga_umum`, t.`harga_jkn`, t.`kode_icd9cm`, t.`aktif`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `tarif_layanan` t WHERE (((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`kode` <=> ?))) LIMIT 1", [fasyankes_id === undefined, fasyankes_id ?? null, kode === undefined, kode ?? null], koneksi);
  if (!baris[0]) throw new Error('Baris tarif_layanan tidak ditemukan.');
  return baris[0];
}

export async function hitungTarifLayananUntukPenunjangPenunjangIntegrasiTest(fasyankes_id: number | undefined, kode: string | undefined, koneksi: Koneksi = pool) {
  const [baris] = await baca<{ jumlah: string | number }>("SELECT COUNT(*) AS jumlah FROM `tarif_layanan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`kode` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null, kode === undefined, kode ?? null], koneksi);
  return Number(baris.jumlah);
}

export async function tambahTarifLayananUntukPenunjangPenunjangIntegrasiTest2(fasyankes_id: number | undefined, kode: string | undefined, nama: string | undefined, jenis: T.JenisTarif | undefined, harga_umum: number | null | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `tarif_layanan` (`fasyankes_id`, `kode`, `nama`, `jenis`, `harga_umum`) VALUES (?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (kode === undefined ? null : kode) ?? null, (nama === undefined ? null : nama) ?? null, ((jenis === undefined ? null : jenis) ?? null), (harga_umum === undefined ? null : harga_umum) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export function hapusTarifLayananFasyankesUji(ids: readonly number[], koneksi: Koneksi = pool) {
  return tulis('DELETE FROM `tarif_layanan` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
