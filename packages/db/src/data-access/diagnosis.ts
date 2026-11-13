import { baca, tulis, pool, type Koneksi } from '../koneksi';
import type * as T from '../tipe';

export async function daftarDiagnosisUntukBacaVersiLepas(fasyankes_id: number | undefined, kunjungan_id: number | undefined, versi: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; kunjungan_id: number; versi: number; kode_icd10: string; nama: string; kode_snomed: string | null; peran: T.PeranDiagnosis; urutan: number; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`versi`, t.`kode_icd10`, t.`nama`, t.`kode_snomed`, t.`peran`, t.`urutan`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `diagnosis` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`kunjungan_id` <=> ?)) AND ((? OR t.`versi` <=> ?)) ORDER BY t.`urutan` ASC", [fasyankes_id === undefined, fasyankes_id ?? null, kunjungan_id === undefined, kunjungan_id ?? null, versi === undefined, versi ?? null], koneksi);
  return baris;
}

export async function tambahBanyakDiagnosisUntukTulisIsi(data: readonly T.DiagnosisBaru[], koneksi: Koneksi = pool) {
  if (!data.length) return { count: 0 };
  const nilai = data.map(d => [(d.fasyankes_id === undefined ? null : d.fasyankes_id) ?? null, (d.kunjungan_id === undefined ? null : d.kunjungan_id) ?? null, (d.versi === undefined ? null : d.versi) ?? null, (d.kode_icd10 === undefined ? null : d.kode_icd10) ?? null, (d.nama === undefined ? null : d.nama) ?? null, (d.kode_snomed === undefined ? null : d.kode_snomed) ?? null, ((d.peran === undefined ? null : d.peran) ?? null), (d.urutan === undefined ? null : d.urutan) ?? null, (d.dibuat_oleh === undefined ? null : d.dibuat_oleh) ?? null, (d.dibuat_pada === undefined ? new Date() : d.dibuat_pada) ?? null]);
  const hasil = await tulis("INSERT INTO `diagnosis` (`fasyankes_id`, `kunjungan_id`, `versi`, `kode_icd10`, `nama`, `kode_snomed`, `peran`, `urutan`, `dibuat_oleh`, `dibuat_pada`) VALUES ?", [nilai], koneksi);
  return { count: hasil.affectedRows };
}

export async function cariDiagnosisUntukKonteks(fasyankes_id: number | undefined, pasien_id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ kunjungan_id: number; versi: number }>("SELECT t.`kunjungan_id`, t.`versi` FROM `diagnosis` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND (EXISTS (SELECT 1 FROM `kunjungan` r1 WHERE t.`kunjungan_id` = r1.`id` AND (((? OR r1.`pasien_id` <=> ?))))) ORDER BY t.`id` DESC LIMIT 1", [fasyankes_id === undefined, fasyankes_id ?? null, pasien_id === undefined, pasien_id ?? null], koneksi);
  return (baris[0] ?? null) as (typeof baris)[number] | null;
}

export async function daftarDiagnosisUntukRiwayatPasien(fasyankes_id: number | undefined, kunjungan_id: readonly (number)[] | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ kunjungan_id: number; versi: number; kode_icd10: string; nama: string; peran: T.PeranDiagnosis }>("SELECT t.`kunjungan_id`, t.`versi`, t.`kode_icd10`, t.`nama`, t.`peran` FROM `diagnosis` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`kunjungan_id` IN (?))) ORDER BY t.`versi` DESC, t.`urutan` ASC", [fasyankes_id === undefined, fasyankes_id ?? null, kunjungan_id === undefined, (kunjungan_id)?.length ? (kunjungan_id) : [null]], koneksi);
  return baris;
}

export async function daftarDiagnosisUntukLaporan(fasyankes_id: number | undefined, kunjungan_id: readonly (number)[] | undefined, peran: T.PeranDiagnosis | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ kunjungan_id: number; kode_icd10: string; nama: string }>("SELECT t.`kunjungan_id`, t.`kode_icd10`, t.`nama` FROM `diagnosis` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`kunjungan_id` IN (?))) AND ((? OR t.`peran` <=> ?)) ORDER BY t.`versi` ASC", [fasyankes_id === undefined, fasyankes_id ?? null, kunjungan_id === undefined, (kunjungan_id)?.length ? (kunjungan_id) : [null], peran === undefined, peran ?? null], koneksi);
  return baris;
}
