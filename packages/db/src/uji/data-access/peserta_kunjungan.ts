import { baca, tulis, pool, type Koneksi } from '../../koneksi';
import type * as T from '../../tipe';

export async function hapusPesertaKunjunganUntukPasienPasienIntegrasiTest(fasyankes_id: readonly (number)[] | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("DELETE t FROM `peserta_kunjungan` t WHERE ((? OR t.`fasyankes_id` IN (?)))", [fasyankes_id === undefined, (fasyankes_id)?.length ? (fasyankes_id) : [null]], koneksi);
  return { count: hasil.affectedRows };
}

export async function daftarPesertaKunjunganUntukPasienPasienIntegrasiTest(kunjungan_id: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number; kunjungan_id: number; pengguna_id: number; tipe: T.TipePeserta; mulai: Date; selesai: Date | null; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`pengguna_id`, t.`tipe`, t.`mulai`, t.`selesai`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `peserta_kunjungan` t WHERE ((? OR t.`kunjungan_id` <=> ?))", [kunjungan_id === undefined, kunjungan_id ?? null], koneksi);
  return baris;
}

export function hapusPesertaKunjunganFasyankesUji(ids: readonly number[], koneksi: Koneksi = pool) {
  return tulis('DELETE FROM `peserta_kunjungan` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
