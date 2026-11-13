import { baca, tulis, pool, type Koneksi } from '../../koneksi';
import type * as T from '../../tipe';

export async function tambahFasyankesUntukAksesIzinIntegrasiTest(fasyankes_id: number | undefined, nama: string | undefined, jenis: T.JenisFasyankes | undefined, kode_registrasi: string | null | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `fasyankes` (`fasyankes_id`, `nama`, `jenis`, `kode_registrasi`) VALUES (?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (nama === undefined ? null : nama) ?? null, ((jenis === undefined ? null : jenis) ?? null), (kode_registrasi === undefined ? null : kode_registrasi) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function tambahFasyankesUntukAksesIzinIntegrasiTestHasil(id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; nama: string; jenis: T.JenisFasyankes; bentuk_usaha: string | null; kode_registrasi: string | null; organization_id: string | null; status_akreditasi: string | null; tanggal_akreditasi: Date | null; puskesmas_wilayah: string | null; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`nama`, t.`jenis`, t.`bentuk_usaha`, t.`kode_registrasi`, t.`organization_id`, t.`status_akreditasi`, t.`tanggal_akreditasi`, t.`puskesmas_wilayah`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `fasyankes` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
  if (!baris[0]) throw new Error('Baris fasyankes tidak ditemukan.');
  return baris[0];
}

export async function ubahFasyankesUntukAksesIzinIntegrasiTest(fasyankes_id: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("UPDATE `fasyankes` t SET `fasyankes_id` = IF(?, t.`fasyankes_id`, ?) WHERE ((? OR t.`id` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export async function hapusFasyankesUntukAksesIzinIntegrasiTest(id: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("DELETE t FROM `fasyankes` t WHERE ((? OR t.`id` <=> ?))", [id === undefined, id ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export async function hapusFasyankesUntukAksesRepositoriIntegrasiTest(id: readonly (number)[] | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("DELETE t FROM `fasyankes` t WHERE ((? OR t.`id` IN (?)))", [id === undefined, (id)?.length ? (id) : [null]], koneksi);
  return { count: hasil.affectedRows };
}

export async function wajibFasyankesUntukSrcSkemaTest(koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; nama: string; jenis: T.JenisFasyankes; bentuk_usaha: string | null; kode_registrasi: string | null; organization_id: string | null; status_akreditasi: string | null; tanggal_akreditasi: Date | null; puskesmas_wilayah: string | null; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`nama`, t.`jenis`, t.`bentuk_usaha`, t.`kode_registrasi`, t.`organization_id`, t.`status_akreditasi`, t.`tanggal_akreditasi`, t.`puskesmas_wilayah`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `fasyankes` t WHERE TRUE LIMIT 1", [], koneksi);
  if (!baris[0]) throw new Error('Baris fasyankes tidak ditemukan.');
  return baris[0];
}

