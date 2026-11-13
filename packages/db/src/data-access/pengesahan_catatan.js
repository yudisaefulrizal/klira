import { baca, tulis, pool } from '../koneksi.js';
export async function tambahPengesahanCatatanUntukTulisPengesahanDalam(fasyankes_id, entitas, entitas_id, versi, pengguna_id, jenis_akun_id, jenis_akun_nama, waktu, hash, dibuat_oleh, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `pengesahan_catatan` (`fasyankes_id`, `entitas`, `entitas_id`, `versi`, `pengguna_id`, `jenis_akun_id`, `jenis_akun_nama`, `waktu`, `hash`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (entitas === undefined ? null : entitas) ?? null, (entitas_id === undefined ? null : entitas_id) ?? null, (versi === undefined ? null : versi) ?? null, (pengguna_id === undefined ? null : pengguna_id) ?? null, (jenis_akun_id === undefined ? null : jenis_akun_id) ?? null, (jenis_akun_nama === undefined ? null : jenis_akun_nama) ?? null, (waktu === undefined ? new Date() : waktu) ?? null, (hash === undefined ? null : hash) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function cariPengesahanCatatanUntukTerakhir(fasyankes_id, entitas, entitas_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`entitas`, t.`entitas_id`, t.`versi`, t.`pengguna_id`, t.`jenis_akun_id`, t.`jenis_akun_nama`, t.`waktu`, t.`hash`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `pengesahan_catatan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`entitas` <=> ?)) AND ((? OR t.`entitas_id` <=> ?)) ORDER BY t.`versi` DESC LIMIT 1", [fasyankes_id === undefined, fasyankes_id ?? null, entitas === undefined, entitas ?? null, entitas_id === undefined, entitas_id ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function cariPengesahanCatatanUntukVersiTerbaru(fasyankes_id, entitas, entitas_id, koneksi = pool) {
    const baris = await baca("SELECT t.`versi` FROM `pengesahan_catatan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`entitas` <=> ?)) AND ((? OR t.`entitas_id` <=> ?)) ORDER BY t.`versi` DESC LIMIT 1", [fasyankes_id === undefined, fasyankes_id ?? null, entitas === undefined, entitas ?? null, entitas_id === undefined, entitas_id ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function daftarPengesahanCatatanUntukBagianDisahkan(fasyankes_id, entitas_id, entitas, koneksi = pool) {
    const baris = await baca("SELECT DISTINCT t.`entitas` FROM `pengesahan_catatan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`entitas_id` <=> ?)) AND ((? OR t.`entitas` IN (?)))", [fasyankes_id === undefined, fasyankes_id ?? null, entitas_id === undefined, entitas_id ?? null, entitas === undefined, (entitas)?.length ? (entitas) : [null]], koneksi);
    return baris;
}
