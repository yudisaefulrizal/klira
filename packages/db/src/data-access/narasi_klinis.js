import { baca, tulis, pool } from '../koneksi.js';
export async function cariNarasiKlinisUntukBacaVersiLepas(fasyankes_id, kunjungan_id, versi, bagian, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`bagian`, t.`isi`, t.`versi`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `narasi_klinis` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`kunjungan_id` <=> ?)) AND ((? OR t.`versi` <=> ?)) AND ((? OR t.`bagian` <=> ?)) LIMIT 1", [fasyankes_id === undefined, fasyankes_id ?? null, kunjungan_id === undefined, kunjungan_id ?? null, versi === undefined, versi ?? null, bagian === undefined, bagian ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function tambahNarasiKlinisUntukTulisIsi(fasyankes_id, kunjungan_id, bagian, isi, versi, dibuat_oleh, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `narasi_klinis` (`fasyankes_id`, `kunjungan_id`, `bagian`, `isi`, `versi`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (kunjungan_id === undefined ? null : kunjungan_id) ?? null, ((bagian === undefined ? null : bagian) ?? null), (isi === undefined ? null : isi) ?? null, (versi === undefined ? null : versi) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
