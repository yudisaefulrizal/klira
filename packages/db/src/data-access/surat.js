import { baca, tulis, pool } from '../koneksi.js';
export async function cariSuratUntukDataCetak(fasyankes_id, kunjungan_id, jenis, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`jenis`, t.`nomor_surat`, t.`tujuan`, t.`isi`, t.`dokter_id`, t.`dibuat_pada` FROM `surat` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`kunjungan_id` <=> ?)) AND ((? OR t.`jenis` <=> ?)) ORDER BY t.`id` DESC LIMIT 1", [fasyankes_id === undefined, fasyankes_id ?? null, kunjungan_id === undefined, kunjungan_id ?? null, jenis === undefined, jenis ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function daftarSuratUntukDaftarSurat(fasyankes_id, kunjungan_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`jenis`, t.`nomor_surat`, t.`tujuan`, t.`isi`, t.`dokter_id`, t.`dibuat_pada` FROM `surat` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`kunjungan_id` <=> ?)) ORDER BY t.`id` DESC", [fasyankes_id === undefined, fasyankes_id ?? null, kunjungan_id === undefined, kunjungan_id ?? null], koneksi);
    return baris;
}
export async function hitungSuratUntukBuatSurat(fasyankes_id, dibuat_pada, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `surat` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`dibuat_pada` >= ?))", [fasyankes_id === undefined, fasyankes_id ?? null, dibuat_pada === undefined, dibuat_pada ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function tambahSuratUntukBuatSurat(fasyankes_id, kunjungan_id, jenis, nomor_surat, tujuan, isi, dokter_id, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `surat` (`fasyankes_id`, `kunjungan_id`, `jenis`, `nomor_surat`, `tujuan`, `isi`, `dokter_id`) VALUES (?, ?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (kunjungan_id === undefined ? null : kunjungan_id) ?? null, (jenis === undefined ? null : jenis) ?? null, (nomor_surat === undefined ? null : nomor_surat) ?? null, (tujuan === undefined ? null : tujuan) ?? null, (isi === undefined ? null : isi) ?? null, (dokter_id === undefined ? null : dokter_id) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function tambahSuratUntukBuatSuratHasil(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`jenis`, t.`nomor_surat`, t.`tujuan`, t.`isi`, t.`dokter_id`, t.`dibuat_pada` FROM `surat` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    if (!baris[0])
        throw new Error('Baris surat tidak ditemukan.');
    return baris[0];
}
