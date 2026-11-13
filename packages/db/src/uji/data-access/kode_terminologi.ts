import { baca, tulis, pool, type Koneksi } from '../../koneksi';
import type * as T from '../../tipe';

export async function tambahBanyakKodeTerminologiUntukKlinisKlinisIntegrasiTest(data: readonly T.KodeTerminologiBaru[], koneksi: Koneksi = pool) {
  if (!data.length) return { count: 0 };
  const nilai = data.map(d => [((d.sistem === undefined ? null : d.sistem) ?? null), (d.kode === undefined ? null : d.kode) ?? null, (d.nama === undefined ? null : d.nama) ?? null, (d.aktif === undefined ? true : d.aktif) ?? null, (d.contoh === undefined ? false : d.contoh) ?? null]);
  const hasil = await tulis("INSERT INTO `kode_terminologi` (`sistem`, `kode`, `nama`, `aktif`, `contoh`) VALUES ?", [nilai], koneksi);
  return { count: hasil.affectedRows };
}

export async function hapusKodeTerminologiUntukKlinisKlinisIntegrasiTest(kode: string | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("DELETE t FROM `kode_terminologi` t WHERE ((? OR t.`kode` LIKE ? ESCAPE '!'))", [kode === undefined, String(kode ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%'], koneksi);
  return { count: hasil.affectedRows };
}

export async function hapusKodeTerminologiUntukSeedTerminologiTest(kode: readonly (string)[] | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("DELETE t FROM `kode_terminologi` t WHERE ((? OR t.`kode` IN (?)))", [kode === undefined, (kode)?.length ? (kode) : [null]], koneksi);
  return { count: hasil.affectedRows };
}

export async function daftarKodeTerminologiUntukSeedTerminologiTest(sistem: T.SistemTerminologi | undefined, kode: string | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; sistem: T.SistemTerminologi; kode: string; nama: string; aktif: boolean; contoh: boolean }>("SELECT t.`id`, t.`sistem`, t.`kode`, t.`nama`, t.`aktif`, t.`contoh` FROM `kode_terminologi` t WHERE ((? OR t.`sistem` <=> ?)) AND ((? OR t.`kode` <=> ?))", [sistem === undefined, sistem ?? null, kode === undefined, kode ?? null], koneksi);
  return baris;
}

export async function wajibKodeTerminologiUntukSeedTerminologiTest(sistem: T.SistemTerminologi | undefined, kode: string | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; sistem: T.SistemTerminologi; kode: string; nama: string; aktif: boolean; contoh: boolean }>("SELECT t.`id`, t.`sistem`, t.`kode`, t.`nama`, t.`aktif`, t.`contoh` FROM `kode_terminologi` t WHERE ((? OR t.`sistem` <=> ?)) AND ((? OR t.`kode` <=> ?)) LIMIT 1", [sistem === undefined, sistem ?? null, kode === undefined, kode ?? null], koneksi);
  if (!baris[0]) throw new Error('Baris kode_terminologi tidak ditemukan.');
  return baris[0];
}
