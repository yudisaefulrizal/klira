import { baca, tulis, pool, type Koneksi } from '../koneksi';
import type * as T from '../tipe';

export async function hitungKodeTerminologiUntukKamusTerminologi(sistem: T.SistemTerminologi | undefined, aktif: boolean | undefined, kode: string | undefined, koneksi: Koneksi = pool) {
  const [baris] = await baca<{ jumlah: string | number }>("SELECT COUNT(*) AS jumlah FROM `kode_terminologi` t WHERE ((? OR t.`sistem` <=> ?)) AND ((? OR t.`aktif` <=> ?)) AND ((? OR t.`kode` LIKE ? ESCAPE '!'))", [sistem === undefined, sistem ?? null, aktif === undefined, aktif ?? null, kode === undefined, String(kode ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%'], koneksi);
  return Number(baris.jumlah);
}

export async function daftarKodeTerminologiUntukKamusTerminologi(sistem: T.SistemTerminologi | undefined, aktif: boolean | undefined, kode: string | undefined, batas: number | undefined, lewati: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ sistem: T.SistemTerminologi; kode: string; nama: string; contoh: boolean }>("SELECT t.`sistem`, t.`kode`, t.`nama`, t.`contoh` FROM `kode_terminologi` t WHERE ((? OR t.`sistem` <=> ?)) AND ((? OR t.`aktif` <=> ?)) AND ((? OR t.`kode` LIKE ? ESCAPE '!')) ORDER BY t.`kode` ASC LIMIT ? OFFSET ?", [sistem === undefined, sistem ?? null, aktif === undefined, aktif ?? null, kode === undefined, String(kode ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', batas ?? 2147483647, lewati ?? 0], koneksi);
  return baris;
}

export async function daftarKodeTerminologiUntukCariTerminologi(sistem: T.SistemTerminologi | undefined, aktif: boolean | undefined, kode: string | undefined, batas: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ sistem: T.SistemTerminologi; kode: string; nama: string; contoh: boolean }>("SELECT t.`sistem`, t.`kode`, t.`nama`, t.`contoh` FROM `kode_terminologi` t WHERE ((? OR t.`sistem` <=> ?)) AND ((? OR t.`aktif` <=> ?)) AND ((? OR t.`kode` LIKE ? ESCAPE '!')) ORDER BY t.`kode` ASC LIMIT ? OFFSET ?", [sistem === undefined, sistem ?? null, aktif === undefined, aktif ?? null, kode === undefined, String(kode ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', batas ?? 2147483647, 0], koneksi);
  return baris;
}

export async function daftarKodeTerminologiUntukCariTerminologi2(sistem: T.SistemTerminologi | undefined, aktif: boolean | undefined, nama: string | undefined, batas: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ sistem: T.SistemTerminologi; kode: string; nama: string; contoh: boolean }>("SELECT t.`sistem`, t.`kode`, t.`nama`, t.`contoh` FROM `kode_terminologi` t WHERE ((? OR t.`sistem` <=> ?)) AND ((? OR t.`aktif` <=> ?)) AND ((? OR t.`nama` LIKE ? ESCAPE '!')) ORDER BY t.`kode` ASC LIMIT ? OFFSET ?", [sistem === undefined, sistem ?? null, aktif === undefined, aktif ?? null, nama === undefined, String(nama ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', batas ?? 2147483647, 0], koneksi);
  return baris;
}

export async function daftarKodeTerminologiUntukCariTerminologi3(sistem: T.SistemTerminologi | undefined, aktif: boolean | undefined, nama: string | undefined, batas: number | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ sistem: T.SistemTerminologi; kode: string; nama: string; contoh: boolean }>("SELECT t.`sistem`, t.`kode`, t.`nama`, t.`contoh` FROM `kode_terminologi` t WHERE ((? OR t.`sistem` <=> ?)) AND ((? OR t.`aktif` <=> ?)) AND ((? OR t.`nama` LIKE ? ESCAPE '!')) ORDER BY t.`kode` ASC LIMIT ? OFFSET ?", [sistem === undefined, sistem ?? null, aktif === undefined, aktif ?? null, nama === undefined, '%' + String(nama ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', batas ?? 2147483647, 0], koneksi);
  return baris;
}

export async function simpanKodeTerminologiUntukSimpanTerminologi(sistem: T.SistemTerminologi | undefined, kode: string | undefined, nama: string | undefined, aktif: boolean | undefined, contoh: boolean | undefined, nama2: string | undefined, aktif2: boolean | undefined, koneksi: Koneksi = pool) {
  const hasil = await tulis("INSERT INTO `kode_terminologi` (`sistem`, `kode`, `nama`, `aktif`, `contoh`) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE `nama` = IF(?, `nama`, ?), `aktif` = IF(?, `aktif`, ?), `contoh` = IF(?, `contoh`, ?), `id` = LAST_INSERT_ID(`id`)", [((sistem === undefined ? null : sistem) ?? null), (kode === undefined ? null : kode) ?? null, (nama === undefined ? null : nama) ?? null, (aktif === undefined ? true : aktif) ?? null, (contoh === undefined ? false : contoh) ?? null, nama2 === undefined, nama2 ?? null, aktif2 === undefined, aktif2 ?? null, contoh === undefined, contoh ?? null], koneksi);
  return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function hitungKodeTerminologiUntukJalankanSeed(koneksi: Koneksi = pool) {
  const [baris] = await baca<{ jumlah: string | number }>("SELECT COUNT(*) AS jumlah FROM `kode_terminologi` t WHERE TRUE", [], koneksi);
  return Number(baris.jumlah);
}
