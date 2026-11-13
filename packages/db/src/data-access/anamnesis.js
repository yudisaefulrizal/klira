import { baca, tulis, pool } from '../koneksi.js';
export async function cariAnamnesisUntukBacaVersiLepas(fasyankes_id, kunjungan_id, versi, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`versi`, t.`keluhan_utama`, t.`penyerta`, t.`riwayat_sekarang`, t.`riwayat_pribadi`, t.`riwayat_keluarga`, t.`kajian_sosial`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `anamnesis` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`kunjungan_id` <=> ?)) AND ((? OR t.`versi` <=> ?)) LIMIT 1", [fasyankes_id === undefined, fasyankes_id ?? null, kunjungan_id === undefined, kunjungan_id ?? null, versi === undefined, versi ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function tambahAnamnesisUntukTulisIsi(fasyankes_id, kunjungan_id, versi, keluhan_utama, penyerta, riwayat_sekarang, riwayat_pribadi, riwayat_keluarga, kajian_sosial, dibuat_oleh, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `anamnesis` (`fasyankes_id`, `kunjungan_id`, `versi`, `keluhan_utama`, `penyerta`, `riwayat_sekarang`, `riwayat_pribadi`, `riwayat_keluarga`, `kajian_sosial`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (kunjungan_id === undefined ? null : kunjungan_id) ?? null, (versi === undefined ? null : versi) ?? null, (keluhan_utama === undefined ? null : keluhan_utama) ?? null, (penyerta === undefined ? null : penyerta) ?? null, (riwayat_sekarang === undefined ? null : riwayat_sekarang) ?? null, (riwayat_pribadi === undefined ? null : riwayat_pribadi) ?? null, (riwayat_keluarga === undefined ? null : riwayat_keluarga) ?? null, (kajian_sosial === undefined ? null : kajian_sosial) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function daftarAnamnesisUntukRiwayatPasien(fasyankes_id, kunjungan_id, koneksi = pool) {
    const baris = await baca("SELECT t.`kunjungan_id`, t.`keluhan_utama` FROM `anamnesis` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`kunjungan_id` IN (?))) ORDER BY t.`versi` DESC", [fasyankes_id === undefined, fasyankes_id ?? null, kunjungan_id === undefined, (kunjungan_id)?.length ? (kunjungan_id) : [null]], koneksi);
    return baris;
}
