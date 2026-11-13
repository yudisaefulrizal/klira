import { baca, tulis, pool, type Koneksi } from '../koneksi';
import type * as T from '../tipe';

export async function tambahPesertaKunjunganUntukDaftarkan(fasyankes_id: number | undefined, kunjungan_id: number | undefined, pengguna_id: number | undefined, tipe: T.TipePeserta | undefined, mulai: Date | undefined, dibuat_oleh: number | null | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `peserta_kunjungan` (`fasyankes_id`, `kunjungan_id`, `pengguna_id`, `tipe`, `mulai`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (kunjungan_id === undefined ? null : kunjungan_id) ?? null, (pengguna_id === undefined ? null : pengguna_id) ?? null, ((tipe === undefined ? null : tipe) ?? null), (mulai === undefined ? new Date() : mulai) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function daftarPesertaKunjunganUntukDetail(kunjungan_id: number | undefined, selesai: Date | null | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; kunjungan_id: number; pengguna_id: number; tipe: T.TipePeserta; mulai: Date; selesai: Date | null; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`pengguna_id`, t.`tipe`, t.`mulai`, t.`selesai`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `peserta_kunjungan` t WHERE ((? OR t.`kunjungan_id` <=> ?)) AND ((? OR t.`selesai` <=> ?)) ORDER BY t.`id` ASC", [kunjungan_id === undefined, kunjungan_id ?? null, selesai === undefined, selesai ?? null], koneksi);
  return baris;
}

export async function daftarPesertaKunjunganUntukTerapkanDpjp(kunjungan_id: number | undefined, selesai: Date | null | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; kunjungan_id: number; pengguna_id: number; tipe: T.TipePeserta; mulai: Date; selesai: Date | null; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`pengguna_id`, t.`tipe`, t.`mulai`, t.`selesai`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `peserta_kunjungan` t WHERE ((? OR t.`kunjungan_id` <=> ?)) AND ((? OR t.`selesai` <=> ?))", [kunjungan_id === undefined, kunjungan_id ?? null, selesai === undefined, selesai ?? null], koneksi);
  return baris;
}

export async function ubahPesertaKunjunganUntukTerapkanDpjp(selesai: Date | null | undefined, id: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("UPDATE `peserta_kunjungan` t SET `selesai` = IF(?, t.`selesai`, ?) WHERE ((? OR t.`id` <=> ?))", [selesai === undefined, selesai ?? null, id === undefined, id ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export async function ubahPesertaKunjunganUntukPulangkan(selesai: Date | null | undefined, kunjungan_id: number | undefined, selesai2: Date | null | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("UPDATE `peserta_kunjungan` t SET `selesai` = IF(?, t.`selesai`, ?) WHERE ((? OR t.`kunjungan_id` <=> ?)) AND ((? OR t.`selesai` <=> ?))", [selesai === undefined, selesai ?? null, kunjungan_id === undefined, kunjungan_id ?? null, selesai2 === undefined, selesai2 ?? null], koneksi);
  return { count: hasil.affectedRows };
}
