import { baca, tulis, pool } from '../koneksi.js';
export async function cariTindakLanjutUntukBacaVersiLepas(fasyankes_id, kunjungan_id, versi, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`versi`, t.`jenis`, t.`tujuan`, t.`spri`, t.`catatan`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `tindak_lanjut` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`kunjungan_id` <=> ?)) AND ((? OR t.`versi` <=> ?)) LIMIT 1", [fasyankes_id === undefined, fasyankes_id ?? null, kunjungan_id === undefined, kunjungan_id ?? null, versi === undefined, versi ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function tambahTindakLanjutUntukTulisIsi(fasyankes_id, kunjungan_id, versi, jenis, tujuan, spri, catatan, dibuat_oleh, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `tindak_lanjut` (`fasyankes_id`, `kunjungan_id`, `versi`, `jenis`, `tujuan`, `spri`, `catatan`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (kunjungan_id === undefined ? null : kunjungan_id) ?? null, (versi === undefined ? null : versi) ?? null, ((jenis === undefined ? null : jenis) ?? null), (tujuan === undefined ? null : tujuan) ?? null, (spri === undefined ? null : spri) ?? null, (catatan === undefined ? null : catatan) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function daftarTindakLanjutUntukRiwayatPasien(fasyankes_id, kunjungan_id, koneksi = pool) {
    const baris = await baca("SELECT t.`kunjungan_id`, t.`jenis` FROM `tindak_lanjut` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`kunjungan_id` IN (?))) ORDER BY t.`versi` DESC", [fasyankes_id === undefined, fasyankes_id ?? null, kunjungan_id === undefined, (kunjungan_id)?.length ? (kunjungan_id) : [null]], koneksi);
    return baris;
}
export async function cariTindakLanjutUntukAsal(kunjungan_id, jenis, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`versi`, t.`jenis`, t.`tujuan`, t.`spri`, t.`catatan`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `tindak_lanjut` t WHERE ((? OR t.`kunjungan_id` <=> ?)) AND ((? OR t.`jenis` <=> ?)) ORDER BY t.`versi` DESC LIMIT 1", [kunjungan_id === undefined, kunjungan_id ?? null, jenis === undefined, jenis ?? null], koneksi);
    return (baris[0] ?? null);
}
