import { baca, tulis, pool, type Koneksi } from '../../koneksi';
import type * as T from '../../tipe';

export async function hitungDrafUntukKlinisKlinisIntegrasiTest(pengguna_id: number | undefined, kunjungan_id: number | undefined, koneksi: Koneksi = pool) {
  const [baris] = await baca<{ jumlah: string | number }>("SELECT COUNT(*) AS jumlah FROM `draf` t WHERE ((? OR t.`pengguna_id` <=> ?)) AND ((? OR t.`kunjungan_id` <=> ?))", [pengguna_id === undefined, pengguna_id ?? null, kunjungan_id === undefined, kunjungan_id ?? null], koneksi);
  return Number(baris.jumlah);
}

export async function wajibDrafUntukKlinisKlinisIntegrasiTest(pengguna_id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; pengguna_id: number; alur: string; kunjungan_id: number; pasien_id: number; langkah_terakhir: number; isi: T.NilaiJson; diperbarui_pada: Date; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`pengguna_id`, t.`alur`, t.`kunjungan_id`, t.`pasien_id`, t.`langkah_terakhir`, t.`isi`, t.`diperbarui_pada`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `draf` t WHERE ((? OR t.`pengguna_id` <=> ?)) LIMIT 1", [pengguna_id === undefined, pengguna_id ?? null], koneksi);
  for (const b of baris) if (typeof b.isi === 'string') b.isi = JSON.parse(b.isi);
  if (!baris[0]) throw new Error('Baris draf tidak ditemukan.');
  return baris[0];
}

export async function ubahDrafUntukKlinisKlinisIntegrasiTest(diperbarui_pada: Date | undefined, pengguna_id: number | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("UPDATE `draf` t SET `diperbarui_pada` = IF(?, t.`diperbarui_pada`, ?) WHERE ((? OR t.`pengguna_id` <=> ?))", [diperbarui_pada === undefined, diperbarui_pada ?? null, pengguna_id === undefined, pengguna_id ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export async function hitungDrafUntukKlinisKlinisIntegrasiTest2(pengguna_id: number | undefined, koneksi: Koneksi = pool) {
  const [baris] = await baca<{ jumlah: string | number }>("SELECT COUNT(*) AS jumlah FROM `draf` t WHERE ((? OR t.`pengguna_id` <=> ?))", [pengguna_id === undefined, pengguna_id ?? null], koneksi);
  return Number(baris.jumlah);
}

export async function hitungDrafUntukKlinisKlinisIntegrasiTest3(kunjungan_id: number | undefined, koneksi: Koneksi = pool) {
  const [baris] = await baca<{ jumlah: string | number }>("SELECT COUNT(*) AS jumlah FROM `draf` t WHERE ((? OR t.`kunjungan_id` <=> ?))", [kunjungan_id === undefined, kunjungan_id ?? null], koneksi);
  return Number(baris.jumlah);
}

export function hapusDrafFasyankesUji(ids: readonly number[], koneksi: Koneksi = pool) {
  return tulis('DELETE FROM `draf` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
