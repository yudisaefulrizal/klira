import { baca, tulis, pool, type Koneksi } from '../koneksi';
import type * as T from '../tipe';

export async function daftarInsidenPasienUntukDaftarInsiden(fasyankes_id: number | undefined, insiden_id: readonly (number)[] | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; insiden_id: number; pasien_id: number }>("SELECT t.`id`, t.`fasyankes_id`, t.`insiden_id`, t.`pasien_id` FROM `insiden_pasien` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`insiden_id` IN (?)))", [fasyankes_id === undefined, fasyankes_id ?? null, insiden_id === undefined, (insiden_id)?.length ? (insiden_id) : [null]], koneksi);
  return baris;
}

export async function daftarInsidenPasienUntukPasienInsiden(fasyankes_id: number | undefined, insiden_id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; insiden_id: number; pasien_id: number }>("SELECT t.`id`, t.`fasyankes_id`, t.`insiden_id`, t.`pasien_id` FROM `insiden_pasien` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`insiden_id` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null, insiden_id === undefined, insiden_id ?? null], koneksi);
  return baris;
}

export async function tambahBanyakInsidenPasienUntukBuatInsiden(data: readonly T.InsidenPasienBaru[], koneksi: Koneksi = pool) {
  if (!data.length) return { count: 0 };
  const nilai = data.map(d => [(d.fasyankes_id === undefined ? null : d.fasyankes_id) ?? null, (d.insiden_id === undefined ? null : d.insiden_id) ?? null, (d.pasien_id === undefined ? null : d.pasien_id) ?? null]);
  const hasil = await tulis("INSERT INTO `insiden_pasien` (`fasyankes_id`, `insiden_id`, `pasien_id`) VALUES ?", [nilai], koneksi);
  return { count: hasil.affectedRows };
}

export async function daftarInsidenPasienUntukUbahInsiden(insiden_id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; insiden_id: number; pasien_id: number }>("SELECT t.`id`, t.`fasyankes_id`, t.`insiden_id`, t.`pasien_id` FROM `insiden_pasien` t WHERE ((? OR t.`insiden_id` <=> ?))", [insiden_id === undefined, insiden_id ?? null], koneksi);
  return baris;
}

