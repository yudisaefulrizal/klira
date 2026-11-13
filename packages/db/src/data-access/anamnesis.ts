import { baca, tulis, pool, type Koneksi } from '../koneksi';


export async function cariAnamnesisUntukBacaVersiLepas(fasyankes_id: number | undefined, kunjungan_id: number | undefined, versi: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; kunjungan_id: number; versi: number; keluhan_utama: string; penyerta: string | null; riwayat_sekarang: string | null; riwayat_pribadi: string | null; riwayat_keluarga: string | null; kajian_sosial: string | null; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`versi`, t.`keluhan_utama`, t.`penyerta`, t.`riwayat_sekarang`, t.`riwayat_pribadi`, t.`riwayat_keluarga`, t.`kajian_sosial`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `anamnesis` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`kunjungan_id` <=> ?)) AND ((? OR t.`versi` <=> ?)) LIMIT 1", [fasyankes_id === undefined, fasyankes_id ?? null, kunjungan_id === undefined, kunjungan_id ?? null, versi === undefined, versi ?? null], koneksi);
  return (baris[0] ?? null) as (typeof baris)[number] | null;
}

export async function tambahAnamnesisUntukTulisIsi(fasyankes_id: number | undefined, kunjungan_id: number | undefined, versi: number | undefined, keluhan_utama: string | undefined, penyerta: string | null | undefined, riwayat_sekarang: string | null | undefined, riwayat_pribadi: string | null | undefined, riwayat_keluarga: string | null | undefined, kajian_sosial: string | null | undefined, dibuat_oleh: number | null | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `anamnesis` (`fasyankes_id`, `kunjungan_id`, `versi`, `keluhan_utama`, `penyerta`, `riwayat_sekarang`, `riwayat_pribadi`, `riwayat_keluarga`, `kajian_sosial`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (kunjungan_id === undefined ? null : kunjungan_id) ?? null, (versi === undefined ? null : versi) ?? null, (keluhan_utama === undefined ? null : keluhan_utama) ?? null, (penyerta === undefined ? null : penyerta) ?? null, (riwayat_sekarang === undefined ? null : riwayat_sekarang) ?? null, (riwayat_pribadi === undefined ? null : riwayat_pribadi) ?? null, (riwayat_keluarga === undefined ? null : riwayat_keluarga) ?? null, (kajian_sosial === undefined ? null : kajian_sosial) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function daftarAnamnesisUntukRiwayatPasien(fasyankes_id: number | undefined, kunjungan_id: readonly (number)[] | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ kunjungan_id: number; keluhan_utama: string }>("SELECT t.`kunjungan_id`, t.`keluhan_utama` FROM `anamnesis` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`kunjungan_id` IN (?))) ORDER BY t.`versi` DESC", [fasyankes_id === undefined, fasyankes_id ?? null, kunjungan_id === undefined, (kunjungan_id)?.length ? (kunjungan_id) : [null]], koneksi);
  return baris;
}
