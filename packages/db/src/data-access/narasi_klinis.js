import { baca, tulis, pool } from '../koneksi.js';
export async function cariNarasiKlinisUntukBacaVersiLepas(kunjungan_id, versi, bagian, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`kunjungan_id`, t.`bagian`, t.`isi`, t.`versi`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `narasi_klinis` t WHERE ((? OR t.`kunjungan_id` <=> ?)) AND ((? OR t.`versi` <=> ?)) AND ((? OR t.`bagian` <=> ?)) LIMIT 1", [kunjungan_id === undefined, kunjungan_id ?? null, versi === undefined, versi ?? null, bagian === undefined, bagian ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function tambahNarasiKlinisUntukTulisIsi(kunjungan_id, bagian, isi, versi, dibuat_oleh, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `narasi_klinis` (`kunjungan_id`, `bagian`, `isi`, `versi`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?)", [(kunjungan_id === undefined ? null : kunjungan_id) ?? null, ((bagian === undefined ? null : bagian) ?? null), (isi === undefined ? null : isi) ?? null, (versi === undefined ? null : versi) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
