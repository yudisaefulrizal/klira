import { baca, tulis, pool } from '../koneksi.js';
/** Tiga shift tetap per klinik (Pagi, Siang, Malam), urut menurut `urutan`. */
export async function daftarShiftUntukDaftar(fasyankes_id, koneksi = pool) {
    return baca("SELECT t.`id`, t.`fasyankes_id`, t.`urutan`, t.`nama`, t.`jam_mulai`, t.`jam_selesai` FROM `shift` t WHERE t.`fasyankes_id` = ? ORDER BY t.`urutan` ASC", [fasyankes_id], koneksi);
}
export async function cariShiftUntukAmbil(id, fasyankes_id, koneksi = pool) {
    const [baris] = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`urutan`, t.`nama`, t.`jam_mulai`, t.`jam_selesai` FROM `shift` t WHERE t.`id` = ? AND t.`fasyankes_id` = ? LIMIT 1", [id, fasyankes_id], koneksi);
    return baris ?? null;
}
export async function ubahShiftUntukUbah(jam_mulai, jam_selesai, id, fasyankes_id, koneksi = pool) {
    const hasil = await tulis("UPDATE `shift` SET `jam_mulai` = ?, `jam_selesai` = ? WHERE `id` = ? AND `fasyankes_id` = ?", [jam_mulai, jam_selesai, id, fasyankes_id], koneksi);
    return { count: hasil.affectedRows };
}
export async function hitungShiftUntukSeed(fasyankes_id, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `shift` WHERE `fasyankes_id` = ?", [fasyankes_id], koneksi);
    return Number(baris.jumlah);
}
export async function tambahShiftUntukSeed(fasyankes_id, urutan, nama, jam_mulai, jam_selesai, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `shift` (`fasyankes_id`, `urutan`, `nama`, `jam_mulai`, `jam_selesai`) VALUES (?, ?, ?, ?, ?)", [fasyankes_id, urutan, nama, jam_mulai, jam_selesai], koneksi);
    return { id: hasil.insertId };
}
