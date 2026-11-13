import { baca, tulis, pool, type Koneksi } from '../koneksi';
import type * as T from '../tipe';

export async function daftarPenempatanUntukBedSemua(fasyankes_id: number | undefined, selesai: Date | null | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; kunjungan_id: number; lokasi_id: number; kelas: T.KelasRawat; indikator: T.IndikatorKelas; tarif_id: number | null; mulai: Date; selesai: Date | null; dibuat_oleh: number | null }>("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`lokasi_id`, t.`kelas`, t.`indikator`, t.`tarif_id`, t.`mulai`, t.`selesai`, t.`dibuat_oleh` FROM `penempatan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`selesai` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null, selesai === undefined, selesai ?? null], koneksi);
  return baris;
}

export async function tambahPenempatanUntukTempatkan(fasyankes_id: number | undefined, kunjungan_id: number | undefined, lokasi_id: number | undefined, kelas: T.KelasRawat | undefined, indikator: T.IndikatorKelas | undefined, tarif_id: number | null | undefined, mulai: Date | undefined, dibuat_oleh: number | null | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `penempatan` (`fasyankes_id`, `kunjungan_id`, `lokasi_id`, `kelas`, `indikator`, `tarif_id`, `mulai`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (kunjungan_id === undefined ? null : kunjungan_id) ?? null, (lokasi_id === undefined ? null : lokasi_id) ?? null, ((kelas === undefined ? null : kelas) ?? null), ((indikator === undefined ? "kelas_tetap" : indikator) ?? null), (tarif_id === undefined ? null : tarif_id) ?? null, (mulai === undefined ? new Date() : mulai) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function daftarPenempatanUntukDetail(kunjungan_id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; kunjungan_id: number; lokasi_id: number; kelas: T.KelasRawat; indikator: T.IndikatorKelas; tarif_id: number | null; mulai: Date; selesai: Date | null; dibuat_oleh: number | null }>("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`lokasi_id`, t.`kelas`, t.`indikator`, t.`tarif_id`, t.`mulai`, t.`selesai`, t.`dibuat_oleh` FROM `penempatan` t WHERE ((? OR t.`kunjungan_id` <=> ?)) ORDER BY t.`id` ASC", [kunjungan_id === undefined, kunjungan_id ?? null], koneksi);
  return baris;
}

export async function cariPenempatanUntukUbahPenempatan(kunjungan_id: number | undefined, selesai: Date | null | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; kunjungan_id: number; lokasi_id: number; kelas: T.KelasRawat; indikator: T.IndikatorKelas; tarif_id: number | null; mulai: Date; selesai: Date | null; dibuat_oleh: number | null }>("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`lokasi_id`, t.`kelas`, t.`indikator`, t.`tarif_id`, t.`mulai`, t.`selesai`, t.`dibuat_oleh` FROM `penempatan` t WHERE ((? OR t.`kunjungan_id` <=> ?)) AND ((? OR t.`selesai` <=> ?)) LIMIT 1", [kunjungan_id === undefined, kunjungan_id ?? null, selesai === undefined, selesai ?? null], koneksi);
  return (baris[0] ?? null) as (typeof baris)[number] | null;
}

export async function ubahPenempatanUntukUbahPenempatan(selesai: Date | null | undefined, id: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("UPDATE `penempatan` t SET `selesai` = IF(?, t.`selesai`, ?) WHERE ((? OR t.`id` <=> ?))", [selesai === undefined, selesai ?? null, id === undefined, id ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export async function daftarPenempatanUntukPulangkan(kunjungan_id: number | undefined, selesai: Date | null | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; kunjungan_id: number; lokasi_id: number; kelas: T.KelasRawat; indikator: T.IndikatorKelas; tarif_id: number | null; mulai: Date; selesai: Date | null; dibuat_oleh: number | null }>("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`lokasi_id`, t.`kelas`, t.`indikator`, t.`tarif_id`, t.`mulai`, t.`selesai`, t.`dibuat_oleh` FROM `penempatan` t WHERE ((? OR t.`kunjungan_id` <=> ?)) AND ((? OR t.`selesai` <=> ?))", [kunjungan_id === undefined, kunjungan_id ?? null, selesai === undefined, selesai ?? null], koneksi);
  return baris;
}

export async function daftarPenempatanUntukPulangkan2(kunjungan_id: number | undefined, tarif_id: number | null | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; kunjungan_id: number; lokasi_id: number; kelas: T.KelasRawat; indikator: T.IndikatorKelas; tarif_id: number | null; mulai: Date; selesai: Date | null; dibuat_oleh: number | null }>("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`lokasi_id`, t.`kelas`, t.`indikator`, t.`tarif_id`, t.`mulai`, t.`selesai`, t.`dibuat_oleh` FROM `penempatan` t WHERE ((? OR t.`kunjungan_id` <=> ?)) AND ((? OR NOT (t.`tarif_id` <=> ?)))", [kunjungan_id === undefined, kunjungan_id ?? null, tarif_id === undefined, tarif_id ?? null], koneksi);
  return baris;
}

export function kunciPenempatanAktif(fasyankesId: number, lokasiId: number, koneksi: Koneksi) {
  return baca<{ id: number }>('SELECT id FROM penempatan WHERE fasyankes_id = ? AND lokasi_id = ? AND selesai IS NULL FOR UPDATE', [fasyankesId, lokasiId], koneksi);
}
