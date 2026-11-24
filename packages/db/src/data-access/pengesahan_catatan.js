import { baca, tulis, pool } from '../koneksi.js';
export async function tambahPengesahanCatatanUntukTulisPengesahanDalam(entitas, entitas_id, versi, pengguna_id, jenis_akun_id, jenis_akun_nama, waktu, hash, dibuat_oleh, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `pengesahan_catatan` (`entitas`, `entitas_id`, `versi`, `pengguna_id`, `jenis_akun_id`, `jenis_akun_nama`, `waktu`, `hash`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [(entitas === undefined ? null : entitas) ?? null, (entitas_id === undefined ? null : entitas_id) ?? null, (versi === undefined ? null : versi) ?? null, (pengguna_id === undefined ? null : pengguna_id) ?? null, (jenis_akun_id === undefined ? null : jenis_akun_id) ?? null, (jenis_akun_nama === undefined ? null : jenis_akun_nama) ?? null, (waktu === undefined ? new Date() : waktu) ?? null, (hash === undefined ? null : hash) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function cariPengesahanCatatanUntukTerakhir(entitas, entitas_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`entitas`, t.`entitas_id`, t.`versi`, t.`pengguna_id`, t.`jenis_akun_id`, t.`jenis_akun_nama`, t.`waktu`, t.`hash`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `pengesahan_catatan` t WHERE ((? OR t.`entitas` <=> ?)) AND ((? OR t.`entitas_id` <=> ?)) ORDER BY t.`versi` DESC LIMIT 1", [entitas === undefined, entitas ?? null, entitas_id === undefined, entitas_id ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function cariPengesahanCatatanUntukVersiTerbaru(entitas, entitas_id, koneksi = pool) {
    const baris = await baca("SELECT t.`versi` FROM `pengesahan_catatan` t WHERE ((? OR t.`entitas` <=> ?)) AND ((? OR t.`entitas_id` <=> ?)) ORDER BY t.`versi` DESC LIMIT 1", [entitas === undefined, entitas ?? null, entitas_id === undefined, entitas_id ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function daftarPengesahanCatatanUntukBagianDisahkan(entitas_id, entitas, koneksi = pool) {
    const baris = await baca("SELECT DISTINCT t.`entitas` FROM `pengesahan_catatan` t WHERE ((? OR t.`entitas_id` <=> ?)) AND ((? OR t.`entitas` IN (?)))", [entitas_id === undefined, entitas_id ?? null, entitas === undefined, (entitas)?.length ? (entitas) : [null]], koneksi);
    return baris;
}
