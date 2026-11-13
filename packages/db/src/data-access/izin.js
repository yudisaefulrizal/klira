import { baca, tulis, pool } from '../koneksi.js';
export async function daftarIzinUntukDaftarIzin(koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fitur`, t.`aksi`, t.`cakupan` FROM `izin` t WHERE TRUE ORDER BY t.`id` ASC", [], koneksi);
    return baris;
}
export async function daftarIzinUntukIzinByIds(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fitur`, t.`aksi`, t.`cakupan` FROM `izin` t WHERE ((? OR t.`id` IN (?)))", [id === undefined, (id)?.length ? (id) : [null]], koneksi);
    return baris;
}
export async function cariIzinUntukCariIzin(fitur, aksi, cakupan, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fitur`, t.`aksi`, t.`cakupan` FROM `izin` t WHERE ((? OR t.`fitur` <=> ?)) AND ((? OR t.`aksi` <=> ?)) AND ((? OR t.`cakupan` <=> ?)) LIMIT 1", [fitur === undefined, fitur ?? null, aksi === undefined, aksi ?? null, cakupan === undefined, cakupan ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function simpanIzinUntukJalankanSeed(fitur, aksi, cakupan, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `izin` (`fitur`, `aksi`, `cakupan`) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE `id` = `id`, `id` = LAST_INSERT_ID(`id`)", [(fitur === undefined ? null : fitur) ?? null, ((aksi === undefined ? null : aksi) ?? null), ((cakupan === undefined ? null : cakupan) ?? null)], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function daftarIzinUntukJalankanSeed(fitur, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`fitur`, t.`aksi`, t.`cakupan`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `izin` t WHERE ((? OR t.`fitur` IN (?)))", [fitur === undefined, (fitur)?.length ? (fitur) : [null]], koneksi);
    return baris;
}
export async function daftarIzinUntukJalankanSeed2(fitur, aksi, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`fitur`, t.`aksi`, t.`cakupan`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `izin` t WHERE ((? OR t.`fitur` IN (?))) AND ((? OR t.`aksi` <=> ?))", [fitur === undefined, (fitur)?.length ? (fitur) : [null], aksi === undefined, aksi ?? null], koneksi);
    return baris;
}
