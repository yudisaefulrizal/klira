import { baca, tulis, pool } from '../koneksi.js';
/** Tiga shift tetap per klinik (Pagi, Siang, Malam), urut menurut `urutan`. */
export async function daftarShiftUntukDaftar(koneksi = pool) {
    return baca("SELECT t.`id`, t.`urutan`, t.`nama`, t.`jam_mulai`, t.`jam_selesai` FROM `shift` t WHERE TRUE ORDER BY t.`urutan` ASC", [], koneksi);
}
export async function cariShiftUntukAmbil(id, koneksi = pool) {
    const [baris] = await baca("SELECT t.`id`, t.`urutan`, t.`nama`, t.`jam_mulai`, t.`jam_selesai` FROM `shift` t WHERE t.`id` = ? LIMIT 1", [id], koneksi);
    return baris ?? null;
}
export async function ubahShiftUntukUbah(jam_mulai, jam_selesai, id, koneksi = pool) {
    const hasil = await tulis("UPDATE `shift` SET `jam_mulai` = ?, `jam_selesai` = ? WHERE `id` = ?", [jam_mulai, jam_selesai, id], koneksi);
    return { count: hasil.affectedRows };
}
export async function hitungShiftUntukSeed(koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `shift` WHERE TRUE", [], koneksi);
    return Number(baris.jumlah);
}
export async function tambahShiftUntukSeed(urutan, nama, jam_mulai, jam_selesai, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `shift` (`urutan`, `nama`, `jam_mulai`, `jam_selesai`) VALUES (?, ?, ?, ?)", [urutan, nama, jam_mulai, jam_selesai], koneksi);
    return { id: hasil.insertId };
}
