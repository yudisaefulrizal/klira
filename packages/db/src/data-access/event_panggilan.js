import { baca, tulis, pool } from '../koneksi.js';
export async function daftarEventPanggilanUntukBuatRuteLayarPanggilan(fasyankes_id, sesi_id, id, batas, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`kode`, t.`poli_id`, t.`poli_nama`, t.`waktu_panggil` FROM `event_panggilan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`sesi_id` <=> ?)) AND ((? OR t.`id` > ?)) ORDER BY t.`id` ASC LIMIT ? OFFSET ?", [fasyankes_id === undefined, fasyankes_id ?? null, sesi_id === undefined, sesi_id ?? null, id === undefined, id ?? null, batas ?? 2147483647, 0], koneksi);
    return baris;
}
export async function cariEventPanggilanUntukBuatRuteLayarPanggilan(fasyankes_id, sesi_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id` FROM `event_panggilan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`sesi_id` <=> ?)) ORDER BY t.`id` DESC LIMIT 1", [fasyankes_id === undefined, fasyankes_id ?? null, sesi_id === undefined, sesi_id ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function tambahEventPanggilanUntukUbahAntrean(fasyankes_id, sesi_id, poli_id, poli_nama, kode, tanggal, waktu_panggil, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `event_panggilan` (`fasyankes_id`, `sesi_id`, `poli_id`, `poli_nama`, `kode`, `tanggal`, `waktu_panggil`) VALUES (?, ?, ?, ?, ?, ?, ?)", [fasyankes_id ?? null, sesi_id ?? null, poli_id ?? null, poli_nama ?? null, kode ?? null, tanggal ?? null, waktu_panggil ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
