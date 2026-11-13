import { baca, tulis, pool, type Koneksi } from '../koneksi';
import type * as T from '../tipe';

export async function cariDrafUntukBacaDraf(fasyankes_id: number | undefined, pengguna_id: number | undefined, alur: string | undefined, kunjungan_id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; pengguna_id: number; alur: string; kunjungan_id: number; pasien_id: number; langkah_terakhir: number; isi: T.NilaiJson; diperbarui_pada: Date; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`pengguna_id`, t.`alur`, t.`kunjungan_id`, t.`pasien_id`, t.`langkah_terakhir`, t.`isi`, t.`diperbarui_pada`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `draf` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`pengguna_id` <=> ?)) AND ((? OR t.`alur` <=> ?)) AND ((? OR t.`kunjungan_id` <=> ?)) LIMIT 1", [fasyankes_id === undefined, fasyankes_id ?? null, pengguna_id === undefined, pengguna_id ?? null, alur === undefined, alur ?? null, kunjungan_id === undefined, kunjungan_id ?? null], koneksi);
  for (const b of baris) if (typeof b.isi === 'string') b.isi = JSON.parse(b.isi);
  return (baris[0] ?? null) as (typeof baris)[number] | null;
}

export async function simpanDrafUntukSimpanDraf(fasyankes_id: number | undefined, pengguna_id: number | undefined, alur: string | undefined, kunjungan_id: number | undefined, pasien_id: number | undefined, langkah_terakhir: number | undefined, isi: T.NilaiJson | undefined, diperbarui_pada: Date | undefined, dibuat_oleh: number | null | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `draf` (`fasyankes_id`, `pengguna_id`, `alur`, `kunjungan_id`, `pasien_id`, `langkah_terakhir`, `isi`, `diperbarui_pada`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE `langkah_terakhir` = IF(?, `langkah_terakhir`, ?), `isi` = IF(?, `isi`, ?), `diperbarui_pada` = IF(?, `diperbarui_pada`, ?), `id` = LAST_INSERT_ID(`id`)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (pengguna_id === undefined ? null : pengguna_id) ?? null, (alur === undefined ? null : alur) ?? null, (kunjungan_id === undefined ? null : kunjungan_id) ?? null, (pasien_id === undefined ? null : pasien_id) ?? null, (langkah_terakhir === undefined ? 0 : langkah_terakhir) ?? null, JSON.stringify((isi === undefined ? null : isi) ?? null), (diperbarui_pada === undefined ? new Date() : diperbarui_pada) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null, langkah_terakhir === undefined, langkah_terakhir ?? null, isi === undefined, JSON.stringify(isi ?? null), diperbarui_pada === undefined, diperbarui_pada ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function simpanDrafUntukSimpanDrafHasil(pengguna_id: number | undefined, alur: string | undefined, kunjungan_id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; pengguna_id: number; alur: string; kunjungan_id: number; pasien_id: number; langkah_terakhir: number; isi: T.NilaiJson; diperbarui_pada: Date; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`pengguna_id`, t.`alur`, t.`kunjungan_id`, t.`pasien_id`, t.`langkah_terakhir`, t.`isi`, t.`diperbarui_pada`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `draf` t WHERE (((? OR t.`pengguna_id` <=> ?)) AND ((? OR t.`alur` <=> ?)) AND ((? OR t.`kunjungan_id` <=> ?))) LIMIT 1", [pengguna_id === undefined, pengguna_id ?? null, alur === undefined, alur ?? null, kunjungan_id === undefined, kunjungan_id ?? null], koneksi);
  for (const b of baris) if (typeof b.isi === 'string') b.isi = JSON.parse(b.isi);
  if (!baris[0]) throw new Error('Baris draf tidak ditemukan.');
  return baris[0];
}

export async function hapusDrafUntukHapusDraf(fasyankes_id: number | undefined, kunjungan_id: number | undefined, pengguna_id: number | undefined, alur: readonly string[], koneksi: Koneksi = pool) {
  const hasil = await tulis("DELETE t FROM `draf` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`kunjungan_id` <=> ?)) AND ((? OR t.`pengguna_id` <=> ?)) AND ((? OR t.`alur` IN (?)))", [fasyankes_id === undefined, fasyankes_id ?? null, kunjungan_id === undefined, kunjungan_id ?? null, pengguna_id === undefined, pengguna_id ?? null, alur === undefined, (alur)?.length ? (alur) : [null]], koneksi);
  return { count: hasil.affectedRows };
}
