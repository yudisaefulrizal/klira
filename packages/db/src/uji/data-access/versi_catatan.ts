import { baca, tulis, pool, type Koneksi } from '../../koneksi';
import type * as T from '../../tipe';

export async function daftarVersiCatatanUntukKlinisKlinisIntegrasiTest(entitas: string | undefined, entitas_id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; entitas: string; entitas_id: number; versi: number; isi_lama: T.NilaiJson; alasan: string; disetujui_oleh: number | null; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`entitas`, t.`entitas_id`, t.`versi`, t.`isi_lama`, t.`alasan`, t.`disetujui_oleh`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `versi_catatan` t WHERE ((? OR t.`entitas` <=> ?)) AND ((? OR t.`entitas_id` <=> ?))", [entitas === undefined, entitas ?? null, entitas_id === undefined, entitas_id ?? null], koneksi);
  for (const b of baris) if (typeof b.isi_lama === 'string') b.isi_lama = JSON.parse(b.isi_lama);
  return baris;
}

export async function wajibVersiCatatanUntukKlinisKlinisIntegrasiTest(entitas: string | undefined, entitas_id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; entitas: string; entitas_id: number; versi: number; isi_lama: T.NilaiJson; alasan: string; disetujui_oleh: number | null; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`entitas`, t.`entitas_id`, t.`versi`, t.`isi_lama`, t.`alasan`, t.`disetujui_oleh`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `versi_catatan` t WHERE ((? OR t.`entitas` <=> ?)) AND ((? OR t.`entitas_id` <=> ?)) LIMIT 1", [entitas === undefined, entitas ?? null, entitas_id === undefined, entitas_id ?? null], koneksi);
  for (const b of baris) if (typeof b.isi_lama === 'string') b.isi_lama = JSON.parse(b.isi_lama);
  if (!baris[0]) throw new Error('Baris versi_catatan tidak ditemukan.');
  return baris[0];
}

export async function cariVersiCatatanUntukKlinisKlinisIntegrasiTest(fasyankes_id: number | undefined, entitas: string | undefined, entitas_id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; entitas: string; entitas_id: number; versi: number; isi_lama: T.NilaiJson; alasan: string; disetujui_oleh: number | null; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`entitas`, t.`entitas_id`, t.`versi`, t.`isi_lama`, t.`alasan`, t.`disetujui_oleh`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `versi_catatan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`entitas` <=> ?)) AND ((? OR t.`entitas_id` <=> ?)) LIMIT 1", [fasyankes_id === undefined, fasyankes_id ?? null, entitas === undefined, entitas ?? null, entitas_id === undefined, entitas_id ?? null], koneksi);
  for (const b of baris) if (typeof b.isi_lama === 'string') b.isi_lama = JSON.parse(b.isi_lama);
  return (baris[0] ?? null) as (typeof baris)[number] | null;
}

export async function hitungVersiCatatanUntukRekamMedisDokumenIntegrasiTest(entitas: string | undefined, entitas_id: number | undefined, koneksi: Koneksi = pool) {
  const [baris] = await baca<{ jumlah: string | number }>("SELECT COUNT(*) AS jumlah FROM `versi_catatan` t WHERE ((? OR t.`entitas` <=> ?)) AND ((? OR t.`entitas_id` <=> ?))", [entitas === undefined, entitas ?? null, entitas_id === undefined, entitas_id ?? null], koneksi);
  return Number(baris.jumlah);
}

export async function cariVersiCatatanUntukRekamMedisRmIntegrasiTest(entitas: string | undefined, entitas_id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; entitas: string; entitas_id: number; versi: number; isi_lama: T.NilaiJson; alasan: string; disetujui_oleh: number | null; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`entitas`, t.`entitas_id`, t.`versi`, t.`isi_lama`, t.`alasan`, t.`disetujui_oleh`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `versi_catatan` t WHERE ((? OR t.`entitas` <=> ?)) AND ((? OR t.`entitas_id` <=> ?)) LIMIT 1", [entitas === undefined, entitas ?? null, entitas_id === undefined, entitas_id ?? null], koneksi);
  for (const b of baris) if (typeof b.isi_lama === 'string') b.isi_lama = JSON.parse(b.isi_lama);
  return (baris[0] ?? null) as (typeof baris)[number] | null;
}

export function hapusVersiCatatanFasyankesUji(ids: readonly number[], koneksi: Koneksi = pool) {
  return tulis('DELETE FROM `versi_catatan` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
