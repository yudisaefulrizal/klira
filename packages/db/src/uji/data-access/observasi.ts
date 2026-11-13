import { baca, tulis, pool, type Koneksi } from '../../koneksi';
import type * as T from '../../tipe';

export async function wajibObservasiUntukKlinisKlinisIntegrasiTest(kunjungan_id: number | undefined, bidang: string | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; kunjungan_id: number; kelompok: T.KelompokObservasi; versi: number; bidang: string; kode_loinc: string | null; nilai: string; satuan_ucum: string | null; waktu: Date; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`kelompok`, t.`versi`, t.`bidang`, t.`kode_loinc`, t.`nilai`, t.`satuan_ucum`, t.`waktu`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `observasi` t WHERE ((? OR t.`kunjungan_id` <=> ?)) AND ((? OR t.`bidang` <=> ?)) LIMIT 1", [kunjungan_id === undefined, kunjungan_id ?? null, bidang === undefined, bidang ?? null], koneksi);
  if (!baris[0]) throw new Error('Baris observasi tidak ditemukan.');
  return baris[0];
}

export async function ubahObservasiUntukKlinisKlinisIntegrasiTest(nilai: string | undefined, kunjungan_id: number | undefined, bidang: string | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("UPDATE `observasi` t SET `nilai` = IF(?, t.`nilai`, ?) WHERE ((? OR t.`kunjungan_id` <=> ?)) AND ((? OR t.`bidang` <=> ?))", [nilai === undefined, nilai ?? null, kunjungan_id === undefined, kunjungan_id ?? null, bidang === undefined, bidang ?? null], koneksi);
  return { count: hasil.affectedRows };
}

export async function hitungObservasiUntukKlinisKlinisIntegrasiTest(kunjungan_id: number | undefined, kelompok: T.KelompokObservasi | undefined, bidang: string | undefined, koneksi: Koneksi = pool) {
  const [baris] = await baca<{ jumlah: string | number }>("SELECT COUNT(*) AS jumlah FROM `observasi` t WHERE ((? OR t.`kunjungan_id` <=> ?)) AND ((? OR t.`kelompok` <=> ?)) AND ((? OR t.`bidang` <=> ?))", [kunjungan_id === undefined, kunjungan_id ?? null, kelompok === undefined, kelompok ?? null, bidang === undefined, bidang ?? null], koneksi);
  return Number(baris.jumlah);
}

export function hapusObservasiFasyankesUji(ids: readonly number[], koneksi: Koneksi = pool) {
  return tulis('DELETE FROM `observasi` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
