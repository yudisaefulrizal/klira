import { baca, tulis, pool, type Koneksi } from '../koneksi';
import type * as T from '../tipe';

export async function daftarIzinUntukDaftarIzin(koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fitur: string; aksi: T.AksiIzin; cakupan: T.CakupanIzin }>("SELECT t.`id`, t.`fitur`, t.`aksi`, t.`cakupan` FROM `izin` t WHERE TRUE ORDER BY t.`id` ASC", [], koneksi);
  return baris;
}

export async function daftarIzinUntukIzinByIds(id: readonly (number)[] | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fitur: string; aksi: T.AksiIzin; cakupan: T.CakupanIzin }>("SELECT t.`id`, t.`fitur`, t.`aksi`, t.`cakupan` FROM `izin` t WHERE ((? OR t.`id` IN (?)))", [id === undefined, (id)?.length ? (id) : [null]], koneksi);
  return baris;
}

export async function cariIzinUntukCariIzin(fitur: string | undefined, aksi: T.AksiIzin | undefined, cakupan: T.CakupanIzin | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fitur: string; aksi: T.AksiIzin; cakupan: T.CakupanIzin }>("SELECT t.`id`, t.`fitur`, t.`aksi`, t.`cakupan` FROM `izin` t WHERE ((? OR t.`fitur` <=> ?)) AND ((? OR t.`aksi` <=> ?)) AND ((? OR t.`cakupan` <=> ?)) LIMIT 1", [fitur === undefined, fitur ?? null, aksi === undefined, aksi ?? null, cakupan === undefined, cakupan ?? null], koneksi);
  return (baris[0] ?? null) as (typeof baris)[number] | null;
}

export async function simpanIzinUntukJalankanSeed(fitur: string | undefined, aksi: T.AksiIzin | undefined, cakupan: T.CakupanIzin | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `izin` (`fitur`, `aksi`, `cakupan`) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE `id` = `id`, `id` = LAST_INSERT_ID(`id`)", [(fitur === undefined ? null : fitur) ?? null, ((aksi === undefined ? null : aksi) ?? null), ((cakupan === undefined ? null : cakupan) ?? null)], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function daftarIzinUntukJalankanSeed(fitur: readonly (string)[] | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number | null; fitur: string; aksi: T.AksiIzin; cakupan: T.CakupanIzin; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`fitur`, t.`aksi`, t.`cakupan`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `izin` t WHERE ((? OR t.`fitur` IN (?)))", [fitur === undefined, (fitur)?.length ? (fitur) : [null]], koneksi);
  return baris;
}

export async function daftarIzinUntukJalankanSeed2(fitur: readonly (string)[] | undefined, aksi: T.AksiIzin | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ id: number; fasyankes_id: number | null; fitur: string; aksi: T.AksiIzin; cakupan: T.CakupanIzin; dibuat_oleh: number | null; dibuat_pada: Date }>("SELECT t.`id`, t.`fasyankes_id`, t.`fitur`, t.`aksi`, t.`cakupan`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `izin` t WHERE ((? OR t.`fitur` IN (?))) AND ((? OR t.`aksi` <=> ?))", [fitur === undefined, (fitur)?.length ? (fitur) : [null], aksi === undefined, aksi ?? null], koneksi);
  return baris;
}
