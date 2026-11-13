import { baca, tulis, pool, type Koneksi } from '../koneksi';
import type * as T from '../tipe';

export async function cariNarasiKlinisUntukBacaVersiLepas(fasyankes_id: number | undefined, kunjungan_id: number | undefined, versi: number | undefined, bagian: T.BagianNarasi | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; kunjungan_id: number; bagian: T.BagianNarasi; isi: string | null; versi: number; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`bagian`, t.`isi`, t.`versi`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `narasi_klinis` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`kunjungan_id` <=> ?)) AND ((? OR t.`versi` <=> ?)) AND ((? OR t.`bagian` <=> ?)) LIMIT 1", [fasyankes_id === undefined, fasyankes_id ?? null, kunjungan_id === undefined, kunjungan_id ?? null, versi === undefined, versi ?? null, bagian === undefined, bagian ?? null], koneksi);
  return (baris[0] ?? null) as (typeof baris)[number] | null;
}

export async function tambahNarasiKlinisUntukTulisIsi(fasyankes_id: number | undefined, kunjungan_id: number | undefined, bagian: T.BagianNarasi | undefined, isi: string | null | undefined, versi: number | undefined, dibuat_oleh: number | null | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `narasi_klinis` (`fasyankes_id`, `kunjungan_id`, `bagian`, `isi`, `versi`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (kunjungan_id === undefined ? null : kunjungan_id) ?? null, ((bagian === undefined ? null : bagian) ?? null), (isi === undefined ? null : isi) ?? null, (versi === undefined ? null : versi) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}
