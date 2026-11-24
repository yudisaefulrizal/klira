import { baca, tulis, pool } from '../koneksi.js';
export async function hitungKebijakanRetensiUntukKebijakan(koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `kebijakan_retensi` t WHERE TRUE", [], koneksi);
    return Number(baris.jumlah);
}
export async function tambahKebijakanRetensiUntukKebijakan(jenis_data, periode_tahun, dasar_hukum, metode_musnah, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `kebijakan_retensi` (`jenis_data`, `periode_tahun`, `dasar_hukum`, `metode_musnah`) VALUES (?, ?, ?, ?)", [(jenis_data === undefined ? null : jenis_data) ?? null, (periode_tahun === undefined ? null : periode_tahun) ?? null, (dasar_hukum === undefined ? null : dasar_hukum) ?? null, (metode_musnah === undefined ? null : metode_musnah) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function daftarKebijakanRetensiUntukKebijakan(koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`jenis_data`, t.`periode_tahun`, t.`dasar_hukum`, t.`metode_musnah`, t.`penanggung_jawab`, t.`dibuat_pada` FROM `kebijakan_retensi` t WHERE TRUE ORDER BY t.`id` ASC", [], koneksi);
    return baris;
}
