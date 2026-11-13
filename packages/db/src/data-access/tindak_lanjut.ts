import { baca, tulis, pool, type Koneksi } from '../koneksi';
import type * as T from '../tipe';

export async function cariTindakLanjutUntukBacaVersiLepas(fasyankes_id: number | undefined, kunjungan_id: number | undefined, versi: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; kunjungan_id: number; versi: number; jenis: T.JenisTindakLanjut; tujuan: string | null; spri: string | null; catatan: string | null; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`versi`, t.`jenis`, t.`tujuan`, t.`spri`, t.`catatan`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `tindak_lanjut` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`kunjungan_id` <=> ?)) AND ((? OR t.`versi` <=> ?)) LIMIT 1", [fasyankes_id === undefined, fasyankes_id ?? null, kunjungan_id === undefined, kunjungan_id ?? null, versi === undefined, versi ?? null], koneksi);
  return (baris[0] ?? null) as (typeof baris)[number] | null;
}

export async function tambahTindakLanjutUntukTulisIsi(fasyankes_id: number | undefined, kunjungan_id: number | undefined, versi: number | undefined, jenis: T.JenisTindakLanjut | undefined, tujuan: string | null | undefined, spri: string | null | undefined, catatan: string | null | undefined, dibuat_oleh: number | null | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `tindak_lanjut` (`fasyankes_id`, `kunjungan_id`, `versi`, `jenis`, `tujuan`, `spri`, `catatan`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (kunjungan_id === undefined ? null : kunjungan_id) ?? null, (versi === undefined ? null : versi) ?? null, ((jenis === undefined ? null : jenis) ?? null), (tujuan === undefined ? null : tujuan) ?? null, (spri === undefined ? null : spri) ?? null, (catatan === undefined ? null : catatan) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function daftarTindakLanjutUntukRiwayatPasien(fasyankes_id: number | undefined, kunjungan_id: readonly (number)[] | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ kunjungan_id: number; jenis: T.JenisTindakLanjut }>("SELECT t.`kunjungan_id`, t.`jenis` FROM `tindak_lanjut` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`kunjungan_id` IN (?))) ORDER BY t.`versi` DESC", [fasyankes_id === undefined, fasyankes_id ?? null, kunjungan_id === undefined, (kunjungan_id)?.length ? (kunjungan_id) : [null]], koneksi);
  return baris;
}

export async function cariTindakLanjutUntukAsal(kunjungan_id: number | undefined, jenis: T.JenisTindakLanjut | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; kunjungan_id: number; versi: number; jenis: T.JenisTindakLanjut; tujuan: string | null; spri: string | null; catatan: string | null; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`versi`, t.`jenis`, t.`tujuan`, t.`spri`, t.`catatan`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `tindak_lanjut` t WHERE ((? OR t.`kunjungan_id` <=> ?)) AND ((? OR t.`jenis` <=> ?)) ORDER BY t.`versi` DESC LIMIT 1", [kunjungan_id === undefined, kunjungan_id ?? null, jenis === undefined, jenis ?? null], koneksi);
  return (baris[0] ?? null) as (typeof baris)[number] | null;
}

