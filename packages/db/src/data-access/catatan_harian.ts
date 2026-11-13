import { baca, tulis, pool, type Koneksi } from '../koneksi';
import type * as T from '../tipe';

export async function daftarCatatanHarianUntukDaftarCatatan(fasyankes_id: number | undefined, kunjungan_id: number | undefined, batas: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; kunjungan_id: number; subjektif: string; objektif: string; asesmen: string; rencana: string; instruksi: string | null; tanda_vital: T.NilaiJson | null; dibuat_oleh: number; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`subjektif`, t.`objektif`, t.`asesmen`, t.`rencana`, t.`instruksi`, t.`tanda_vital`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `catatan_harian` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`kunjungan_id` <=> ?)) ORDER BY t.`id` DESC LIMIT ? OFFSET ?", [fasyankes_id === undefined, fasyankes_id ?? null, kunjungan_id === undefined, kunjungan_id ?? null, batas ?? 2147483647, 0], koneksi);
  for (const b of baris) if (typeof b.tanda_vital === 'string') b.tanda_vital = JSON.parse(b.tanda_vital);
  return baris;
}

export async function cariCatatanHarianUntukIsiCatatan(id: number | undefined, fasyankes_id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; kunjungan_id: number; subjektif: string; objektif: string; asesmen: string; rencana: string; instruksi: string | null; tanda_vital: T.NilaiJson | null; dibuat_oleh: number; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`subjektif`, t.`objektif`, t.`asesmen`, t.`rencana`, t.`instruksi`, t.`tanda_vital`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `catatan_harian` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) LIMIT 1", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
  for (const b of baris) if (typeof b.tanda_vital === 'string') b.tanda_vital = JSON.parse(b.tanda_vital);
  return (baris[0] ?? null) as (typeof baris)[number] | null;
}

export async function tambahCatatanHarianUntukTambahCatatan(fasyankes_id: number | undefined, kunjungan_id: number | undefined, subjektif: string | undefined, objektif: string | undefined, asesmen: string | undefined, rencana: string | undefined, instruksi: string | null | undefined, tanda_vital: T.NilaiJson | null | undefined, dibuat_oleh: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `catatan_harian` (`fasyankes_id`, `kunjungan_id`, `subjektif`, `objektif`, `asesmen`, `rencana`, `instruksi`, `tanda_vital`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (kunjungan_id === undefined ? null : kunjungan_id) ?? null, (subjektif === undefined ? null : subjektif) ?? null, (objektif === undefined ? null : objektif) ?? null, (asesmen === undefined ? null : asesmen) ?? null, (rencana === undefined ? null : rencana) ?? null, (instruksi === undefined ? null : instruksi) ?? null, JSON.stringify((tanda_vital === undefined ? null : tanda_vital) ?? null), (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function tambahCatatanHarianUntukTambahCatatanHasil(id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; kunjungan_id: number; subjektif: string; objektif: string; asesmen: string; rencana: string; instruksi: string | null; tanda_vital: T.NilaiJson | null; dibuat_oleh: number; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`subjektif`, t.`objektif`, t.`asesmen`, t.`rencana`, t.`instruksi`, t.`tanda_vital`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `catatan_harian` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
  for (const b of baris) if (typeof b.tanda_vital === 'string') b.tanda_vital = JSON.parse(b.tanda_vital);
  if (!baris[0]) throw new Error('Baris catatan_harian tidak ditemukan.');
  return baris[0];
}
