import { baca, tulis, pool } from '../koneksi.js';
import { wajibId } from '../wajib.js';
export async function cariSuratUntukDataCetak(kunjungan_id, jenis, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`kunjungan_id`, t.`jenis`, t.`nomor_surat`, t.`tujuan`, t.`isi`, t.`dokter_id`, t.`dibuat_pada` FROM `surat` t WHERE ((? OR t.`kunjungan_id` <=> ?)) AND ((? OR t.`jenis` <=> ?)) ORDER BY t.`id` DESC LIMIT 1", [kunjungan_id === undefined, kunjungan_id ?? null, jenis === undefined, jenis ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function daftarSuratUntukDaftarSurat(kunjungan_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`kunjungan_id`, t.`jenis`, t.`nomor_surat`, t.`tujuan`, t.`isi`, t.`dokter_id`, t.`dibuat_pada` FROM `surat` t WHERE ((? OR t.`kunjungan_id` <=> ?)) ORDER BY t.`id` DESC", [kunjungan_id === undefined, kunjungan_id ?? null], koneksi);
    return baris;
}
export async function hitungSuratUntukBuatSurat(dibuat_pada, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `surat` t WHERE ((? OR t.`dibuat_pada` >= ?))", [dibuat_pada === undefined, dibuat_pada ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function tambahSuratUntukBuatSurat(kunjungan_id, jenis, nomor_surat, tujuan, isi, dokter_id, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `surat` (`kunjungan_id`, `jenis`, `nomor_surat`, `tujuan`, `isi`, `dokter_id`) VALUES (?, ?, ?, ?, ?, ?)", [(kunjungan_id === undefined ? null : kunjungan_id) ?? null, (jenis === undefined ? null : jenis) ?? null, (nomor_surat === undefined ? null : nomor_surat) ?? null, (tujuan === undefined ? null : tujuan) ?? null, (isi === undefined ? null : isi) ?? null, (dokter_id === undefined ? null : dokter_id) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function tambahSuratUntukBuatSuratHasil(id, koneksi = pool) {
    wajibId('tambahSuratUntukBuatSuratHasil', id);
    const baris = await baca("SELECT t.`id`, t.`kunjungan_id`, t.`jenis`, t.`nomor_surat`, t.`tujuan`, t.`isi`, t.`dokter_id`, t.`dibuat_pada` FROM `surat` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    if (!baris[0])
        throw new Error('Baris surat tidak ditemukan.');
    return baris[0];
}
