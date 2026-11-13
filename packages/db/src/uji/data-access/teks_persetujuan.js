import { baca, tulis, pool } from '../../koneksi.js';
export async function wajibTeksPersetujuanUntukPasienPasienIntegrasiTest(fasyankes_id, jenis, versi, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`jenis`, t.`versi`, t.`judul`, t.`tujuan`, t.`isi`, t.`aktif`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `teks_persetujuan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`jenis` <=> ?)) AND ((? OR t.`versi` <=> ?)) LIMIT 1", [fasyankes_id === undefined, fasyankes_id ?? null, jenis === undefined, jenis ?? null, versi === undefined, versi ?? null], koneksi);
    if (!baris[0])
        throw new Error('Baris teks_persetujuan tidak ditemukan.');
    return baris[0];
}
export async function hapusTeksPersetujuanUntukPasienPasienIntegrasiTest(fasyankes_id, koneksi = pool) {
    const hasil = await tulis("DELETE t FROM `teks_persetujuan` t WHERE ((? OR t.`fasyankes_id` IN (?)))", [fasyankes_id === undefined, (fasyankes_id)?.length ? (fasyankes_id) : [null]], koneksi);
    return { count: hasil.affectedRows };
}
export async function tambahTeksPersetujuanUntukPasienPasienIntegrasiTest(fasyankes_id, jenis, versi, judul, tujuan, isi, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `teks_persetujuan` (`fasyankes_id`, `jenis`, `versi`, `judul`, `tujuan`, `isi`) VALUES (?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, ((jenis === undefined ? null : jenis) ?? null), (versi === undefined ? null : versi) ?? null, (judul === undefined ? null : judul) ?? null, (tujuan === undefined ? null : tujuan) ?? null, (isi === undefined ? null : isi) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function tambahTeksPersetujuanUntukPasienPasienIntegrasiTestHasil(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`jenis`, t.`versi`, t.`judul`, t.`tujuan`, t.`isi`, t.`aktif`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `teks_persetujuan` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    if (!baris[0])
        throw new Error('Baris teks_persetujuan tidak ditemukan.');
    return baris[0];
}
export async function ubahTeksPersetujuanUntukPasienPasienIntegrasiTest(aktif, id, koneksi = pool) {
    const hasil = await tulis("UPDATE `teks_persetujuan` t SET `aktif` = IF(?, t.`aktif`, ?) WHERE ((? OR t.`id` <=> ?))", [aktif === undefined, aktif ?? null, id === undefined, id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function tambahTeksPersetujuanUntukPenunjangPenunjangIntegrasiTest(fasyankes_id, jenis, versi, judul, tujuan, isi, aktif, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `teks_persetujuan` (`fasyankes_id`, `jenis`, `versi`, `judul`, `tujuan`, `isi`, `aktif`) VALUES (?, ?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, ((jenis === undefined ? null : jenis) ?? null), (versi === undefined ? null : versi) ?? null, (judul === undefined ? null : judul) ?? null, (tujuan === undefined ? null : tujuan) ?? null, (isi === undefined ? null : isi) ?? null, (aktif === undefined ? true : aktif) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function daftarTeksPersetujuanUntukSrcSkemaTest(fasyankes_id, jenis, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`jenis`, t.`versi`, t.`judul`, t.`tujuan`, t.`isi`, t.`aktif`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `teks_persetujuan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`jenis` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null, jenis === undefined, jenis ?? null], koneksi);
    return baris;
}
export function hapusTeksPersetujuanFasyankesUji(ids, koneksi = pool) {
    return tulis('DELETE FROM `teks_persetujuan` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
