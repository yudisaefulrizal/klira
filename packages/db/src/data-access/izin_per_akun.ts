import { baca, tulis, pool, type Koneksi } from '../koneksi';
import type * as T from '../tipe';

export async function daftarIzinPerAkunUntukDaftarIzinAkun(pengguna_id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; pengguna_id: number; izin_id: number; tipe: T.TipeIzinAkun; alasan: string; mulai: Date; selesai: Date | null; ditetapkan_oleh: number | null }>("SELECT t.`id`, t.`fasyankes_id`, t.`pengguna_id`, t.`izin_id`, t.`tipe`, t.`alasan`, t.`mulai`, t.`selesai`, t.`ditetapkan_oleh` FROM `izin_per_akun` t WHERE ((? OR t.`pengguna_id` <=> ?)) ORDER BY t.`id` ASC", [pengguna_id === undefined, pengguna_id ?? null], koneksi);
  return baris;
}

export async function cariIzinPerAkunUntukAmbilIzinAkun(id: number | undefined, pengguna_id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; pengguna_id: number; izin_id: number; tipe: T.TipeIzinAkun; alasan: string; mulai: Date; selesai: Date | null; ditetapkan_oleh: number | null }>("SELECT t.`id`, t.`fasyankes_id`, t.`pengguna_id`, t.`izin_id`, t.`tipe`, t.`alasan`, t.`mulai`, t.`selesai`, t.`ditetapkan_oleh` FROM `izin_per_akun` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`pengguna_id` <=> ?)) LIMIT 1", [id === undefined, id ?? null, pengguna_id === undefined, pengguna_id ?? null], koneksi);
  return (baris[0] ?? null) as (typeof baris)[number] | null;
}

export async function tambahIzinPerAkunUntukBuatIzinAkun(fasyankes_id: number | undefined, pengguna_id: number | undefined, izin_id: number | undefined, tipe: T.TipeIzinAkun | undefined, alasan: string | undefined, mulai: Date | undefined, selesai: Date | null | undefined, ditetapkan_oleh: number | null | undefined, dibuat_oleh: number | null | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `izin_per_akun` (`fasyankes_id`, `pengguna_id`, `izin_id`, `tipe`, `alasan`, `mulai`, `selesai`, `ditetapkan_oleh`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (pengguna_id === undefined ? null : pengguna_id) ?? null, (izin_id === undefined ? null : izin_id) ?? null, ((tipe === undefined ? null : tipe) ?? null), (alasan === undefined ? null : alasan) ?? null, (mulai === undefined ? null : mulai) ?? null, (selesai === undefined ? null : selesai) ?? null, (ditetapkan_oleh === undefined ? null : ditetapkan_oleh) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function tambahIzinPerAkunUntukBuatIzinAkunHasil(id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; pengguna_id: number; izin_id: number; tipe: T.TipeIzinAkun; alasan: string; mulai: Date; selesai: Date | null; ditetapkan_oleh: number | null }>("SELECT t.`id`, t.`fasyankes_id`, t.`pengguna_id`, t.`izin_id`, t.`tipe`, t.`alasan`, t.`mulai`, t.`selesai`, t.`ditetapkan_oleh` FROM `izin_per_akun` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
  if (!baris[0]) throw new Error('Baris izin_per_akun tidak ditemukan.');
  return baris[0];
}

export async function ubahIzinPerAkunUntukAkhiriIzinAkun(selesai: Date | null | undefined, id: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("UPDATE `izin_per_akun` t SET `selesai` = IF(?, t.`selesai`, ?) WHERE ((? OR t.`id` <=> ?))", [selesai === undefined, selesai ?? null, id === undefined, id ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export async function tambahIzinPerAkunUntukBuatAkun(fasyankes_id: number | undefined, pengguna_id: number | undefined, izin_id: number | undefined, tipe: T.TipeIzinAkun | undefined, alasan: string | undefined, mulai: Date | undefined, selesai: Date | null | undefined, ditetapkan_oleh: number | null | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `izin_per_akun` (`fasyankes_id`, `pengguna_id`, `izin_id`, `tipe`, `alasan`, `mulai`, `selesai`, `ditetapkan_oleh`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (pengguna_id === undefined ? null : pengguna_id) ?? null, (izin_id === undefined ? null : izin_id) ?? null, ((tipe === undefined ? null : tipe) ?? null), (alasan === undefined ? null : alasan) ?? null, (mulai === undefined ? null : mulai) ?? null, (selesai === undefined ? null : selesai) ?? null, (ditetapkan_oleh === undefined ? null : ditetapkan_oleh) ?? null, (ditetapkan_oleh === undefined ? null : ditetapkan_oleh) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function tambahIzinPerAkunUntukBuatAkunHasil(id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; pengguna_id: number; izin_id: number; tipe: T.TipeIzinAkun; alasan: string; mulai: Date; selesai: Date | null; ditetapkan_oleh: number | null; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`pengguna_id`, t.`izin_id`, t.`tipe`, t.`alasan`, t.`mulai`, t.`selesai`, t.`ditetapkan_oleh`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `izin_per_akun` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
  if (!baris[0]) throw new Error('Baris izin_per_akun tidak ditemukan.');
  return baris[0];
}
