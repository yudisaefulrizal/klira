import { baca, tulis, pool } from '../koneksi.js';
export async function daftarObservasiUntukBacaVersiLepas(fasyankes_id, kunjungan_id, versi, kelompok, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`kelompok`, t.`versi`, t.`bidang`, t.`kode_loinc`, t.`nilai`, t.`satuan_ucum`, t.`waktu`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `observasi` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`kunjungan_id` <=> ?)) AND ((? OR t.`versi` <=> ?)) AND ((? OR t.`kelompok` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null, kunjungan_id === undefined, kunjungan_id ?? null, versi === undefined, versi ?? null, kelompok === undefined, kelompok ?? null], koneksi);
    return baris;
}
export async function tambahBanyakObservasiUntukTulisIsi(data, koneksi = pool) {
    if (!data.length)
        return { count: 0 };
    const nilai = data.map(d => [(d.fasyankes_id === undefined ? null : d.fasyankes_id) ?? null, (d.kunjungan_id === undefined ? null : d.kunjungan_id) ?? null, ((d.kelompok === undefined ? null : d.kelompok) ?? null), (d.versi === undefined ? null : d.versi) ?? null, (d.bidang === undefined ? null : d.bidang) ?? null, (d.kode_loinc === undefined ? null : d.kode_loinc) ?? null, (d.nilai === undefined ? null : d.nilai) ?? null, (d.satuan_ucum === undefined ? null : d.satuan_ucum) ?? null, (d.waktu === undefined ? new Date() : d.waktu) ?? null, (d.dibuat_oleh === undefined ? null : d.dibuat_oleh) ?? null, (d.dibuat_pada === undefined ? new Date() : d.dibuat_pada) ?? null]);
    const hasil = await tulis("INSERT INTO `observasi` (`fasyankes_id`, `kunjungan_id`, `kelompok`, `versi`, `bidang`, `kode_loinc`, `nilai`, `satuan_ucum`, `waktu`, `dibuat_oleh`, `dibuat_pada`) VALUES ?", [nilai], koneksi);
    return { count: hasil.affectedRows };
}
export async function cariObservasiUntukKonteks(fasyankes_id, kelompok, pasien_id, koneksi = pool) {
    const baris = await baca("SELECT t.`kunjungan_id`, t.`versi` FROM `observasi` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`kelompok` <=> ?)) AND (EXISTS (SELECT 1 FROM `kunjungan` r1 WHERE t.`kunjungan_id` = r1.`id` AND (((? OR r1.`pasien_id` <=> ?))))) ORDER BY t.`id` DESC LIMIT 1", [fasyankes_id === undefined, fasyankes_id ?? null, kelompok === undefined, kelompok ?? null, pasien_id === undefined, pasien_id ?? null], koneksi);
    return (baris[0] ?? null);
}
