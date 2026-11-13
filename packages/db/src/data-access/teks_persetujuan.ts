import { baca, tulis, pool, type Koneksi } from '../koneksi';
import type * as T from '../tipe';

export async function cariTeksPersetujuanUntukTeksAktif(fasyankes_id: number | null | undefined, jenis: T.JenisPersetujuan | undefined, aktif: boolean | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; jenis: T.JenisPersetujuan; versi: number; judul: string; tujuan: string; isi: string }>("SELECT t.`id`, t.`jenis`, t.`versi`, t.`judul`, t.`tujuan`, t.`isi` FROM `teks_persetujuan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`jenis` <=> ?)) AND ((? OR t.`aktif` <=> ?)) ORDER BY t.`versi` DESC LIMIT 1", [fasyankes_id === undefined, fasyankes_id ?? null, jenis === undefined, jenis ?? null, aktif === undefined, aktif ?? null], koneksi);
  return (baris[0] ?? null) as (typeof baris)[number] | null;
}

export async function cariTeksPersetujuanUntukTeksUntukPakai(id: number | undefined, jenis: T.JenisPersetujuan | undefined, aktif: boolean | undefined, fasyankes_id: number | null | undefined, fasyankes_id2: number | null | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; jenis: T.JenisPersetujuan; versi: number; judul: string; tujuan: string; isi: string }>("SELECT t.`id`, t.`jenis`, t.`versi`, t.`judul`, t.`tujuan`, t.`isi` FROM `teks_persetujuan` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`jenis` <=> ?)) AND ((? OR t.`aktif` <=> ?)) AND ((((? OR t.`fasyankes_id` <=> ?))) OR (((? OR t.`fasyankes_id` <=> ?)))) LIMIT 1", [id === undefined, id ?? null, jenis === undefined, jenis ?? null, aktif === undefined, aktif ?? null, fasyankes_id === undefined, fasyankes_id ?? null, fasyankes_id2 === undefined, fasyankes_id2 ?? null], koneksi);
  return (baris[0] ?? null) as (typeof baris)[number] | null;
}

export async function daftarTeksPersetujuanUntukDaftarTeksPdp(fasyankes_id: number | null | undefined, jenis: T.JenisPersetujuan | undefined, batas: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number | null; jenis: T.JenisPersetujuan; versi: number; judul: string; tujuan: string; isi: string; aktif: boolean; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`jenis`, t.`versi`, t.`judul`, t.`tujuan`, t.`isi`, t.`aktif`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `teks_persetujuan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`jenis` <=> ?)) ORDER BY t.`versi` DESC LIMIT ? OFFSET ?", [fasyankes_id === undefined, fasyankes_id ?? null, jenis === undefined, jenis ?? null, batas ?? 2147483647, 0], koneksi);
  return baris;
}

export async function ringkasanTeksPersetujuanUntukBuatTeksPdp(fasyankes_id: number | null | undefined, jenis: T.JenisPersetujuan | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ _max_versi: number | null }>("SELECT MAX(t.`versi`) AS `_max_versi` FROM `teks_persetujuan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`jenis` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null, jenis === undefined, jenis ?? null], koneksi);
  const hasil = baris.map(b => ({ _max: { versi: b._max_versi } }));
  return hasil[0];
}

export async function ubahTeksPersetujuanUntukBuatTeksPdp(aktif: boolean | undefined, fasyankes_id: number | null | undefined, jenis: T.JenisPersetujuan | undefined, aktif2: boolean | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("UPDATE `teks_persetujuan` t SET `aktif` = IF(?, t.`aktif`, ?) WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`jenis` <=> ?)) AND ((? OR t.`aktif` <=> ?))", [aktif === undefined, aktif ?? null, fasyankes_id === undefined, fasyankes_id ?? null, jenis === undefined, jenis ?? null, aktif2 === undefined, aktif2 ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export async function tambahTeksPersetujuanUntukBuatTeksPdp(fasyankes_id: number | null | undefined, jenis: T.JenisPersetujuan | undefined, versi: number | undefined, judul: string | undefined, tujuan: string | undefined, isi: string | undefined, aktif: boolean | undefined, dibuat_oleh: number | null | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `teks_persetujuan` (`fasyankes_id`, `jenis`, `versi`, `judul`, `tujuan`, `isi`, `aktif`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, ((jenis === undefined ? null : jenis) ?? null), (versi === undefined ? null : versi) ?? null, (judul === undefined ? null : judul) ?? null, (tujuan === undefined ? null : tujuan) ?? null, (isi === undefined ? null : isi) ?? null, (aktif === undefined ? true : aktif) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function tambahTeksPersetujuanUntukBuatTeksPdpHasil(id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number | null; jenis: T.JenisPersetujuan; versi: number; judul: string; tujuan: string; isi: string; aktif: boolean; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`jenis`, t.`versi`, t.`judul`, t.`tujuan`, t.`isi`, t.`aktif`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `teks_persetujuan` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
  if (!baris[0]) throw new Error('Baris teks_persetujuan tidak ditemukan.');
  return baris[0];
}

export async function cariTeksPersetujuanUntukSeedTeksPersetujuan(fasyankes_id: number | null | undefined, jenis: T.JenisPersetujuan | undefined, versi: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number | null; jenis: T.JenisPersetujuan; versi: number; judul: string; tujuan: string; isi: string; aktif: boolean; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`jenis`, t.`versi`, t.`judul`, t.`tujuan`, t.`isi`, t.`aktif`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `teks_persetujuan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`jenis` <=> ?)) AND ((? OR t.`versi` <=> ?)) LIMIT 1", [fasyankes_id === undefined, fasyankes_id ?? null, jenis === undefined, jenis ?? null, versi === undefined, versi ?? null], koneksi);
  return (baris[0] ?? null) as (typeof baris)[number] | null;
}

export async function tambahTeksPersetujuanUntukSeedTeksPersetujuan(jenis: T.JenisPersetujuan | undefined, versi: number | undefined, judul: string | undefined, tujuan: string | undefined, isi: string | undefined, aktif: boolean | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `teks_persetujuan` (`jenis`, `versi`, `judul`, `tujuan`, `isi`, `aktif`) VALUES (?, ?, ?, ?, ?, ?)", [((jenis === undefined ? null : jenis) ?? null), (versi === undefined ? null : versi) ?? null, (judul === undefined ? null : judul) ?? null, (tujuan === undefined ? null : tujuan) ?? null, (isi === undefined ? null : isi) ?? null, (aktif === undefined ? true : aktif) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}
