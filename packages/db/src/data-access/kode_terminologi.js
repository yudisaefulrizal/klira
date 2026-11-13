import { baca, tulis, pool } from '../koneksi.js';
export async function hitungKodeTerminologiUntukKamusTerminologi(sistem, aktif, kode, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `kode_terminologi` t WHERE ((? OR t.`sistem` <=> ?)) AND ((? OR t.`aktif` <=> ?)) AND ((? OR t.`kode` LIKE ? ESCAPE '!'))", [sistem === undefined, sistem ?? null, aktif === undefined, aktif ?? null, kode === undefined, String(kode ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%'], koneksi);
    return Number(baris.jumlah);
}
export async function daftarKodeTerminologiUntukKamusTerminologi(sistem, aktif, kode, batas, lewati, koneksi = pool) {
    const baris = await baca("SELECT t.`sistem`, t.`kode`, t.`nama`, t.`contoh` FROM `kode_terminologi` t WHERE ((? OR t.`sistem` <=> ?)) AND ((? OR t.`aktif` <=> ?)) AND ((? OR t.`kode` LIKE ? ESCAPE '!')) ORDER BY t.`kode` ASC LIMIT ? OFFSET ?", [sistem === undefined, sistem ?? null, aktif === undefined, aktif ?? null, kode === undefined, String(kode ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', batas ?? 2147483647, lewati ?? 0], koneksi);
    return baris;
}
export async function daftarKodeTerminologiUntukCariTerminologi(sistem, aktif, kode, batas, koneksi = pool) {
    const baris = await baca("SELECT t.`sistem`, t.`kode`, t.`nama`, t.`contoh` FROM `kode_terminologi` t WHERE ((? OR t.`sistem` <=> ?)) AND ((? OR t.`aktif` <=> ?)) AND ((? OR t.`kode` LIKE ? ESCAPE '!')) ORDER BY t.`kode` ASC LIMIT ? OFFSET ?", [sistem === undefined, sistem ?? null, aktif === undefined, aktif ?? null, kode === undefined, String(kode ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', batas ?? 2147483647, 0], koneksi);
    return baris;
}
export async function daftarKodeTerminologiUntukCariTerminologi2(sistem, aktif, nama, batas, koneksi = pool) {
    const baris = await baca("SELECT t.`sistem`, t.`kode`, t.`nama`, t.`contoh` FROM `kode_terminologi` t WHERE ((? OR t.`sistem` <=> ?)) AND ((? OR t.`aktif` <=> ?)) AND ((? OR t.`nama` LIKE ? ESCAPE '!')) ORDER BY t.`kode` ASC LIMIT ? OFFSET ?", [sistem === undefined, sistem ?? null, aktif === undefined, aktif ?? null, nama === undefined, String(nama ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', batas ?? 2147483647, 0], koneksi);
    return baris;
}
export async function daftarKodeTerminologiUntukCariTerminologi3(sistem, aktif, nama, batas, koneksi = pool) {
    const baris = await baca("SELECT t.`sistem`, t.`kode`, t.`nama`, t.`contoh` FROM `kode_terminologi` t WHERE ((? OR t.`sistem` <=> ?)) AND ((? OR t.`aktif` <=> ?)) AND ((? OR t.`nama` LIKE ? ESCAPE '!')) ORDER BY t.`kode` ASC LIMIT ? OFFSET ?", [sistem === undefined, sistem ?? null, aktif === undefined, aktif ?? null, nama === undefined, '%' + String(nama ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', batas ?? 2147483647, 0], koneksi);
    return baris;
}
export async function simpanKodeTerminologiUntukSimpanTerminologi(sistem, kode, nama, aktif, contoh, nama2, aktif2, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `kode_terminologi` (`sistem`, `kode`, `nama`, `aktif`, `contoh`) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE `nama` = IF(?, `nama`, ?), `aktif` = IF(?, `aktif`, ?), `contoh` = IF(?, `contoh`, ?), `id` = LAST_INSERT_ID(`id`)", [((sistem === undefined ? null : sistem) ?? null), (kode === undefined ? null : kode) ?? null, (nama === undefined ? null : nama) ?? null, (aktif === undefined ? true : aktif) ?? null, (contoh === undefined ? false : contoh) ?? null, nama2 === undefined, nama2 ?? null, aktif2 === undefined, aktif2 ?? null, contoh === undefined, contoh ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function hitungKodeTerminologiUntukJalankanSeed(koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `kode_terminologi` t WHERE TRUE", [], koneksi);
    return Number(baris.jumlah);
}
