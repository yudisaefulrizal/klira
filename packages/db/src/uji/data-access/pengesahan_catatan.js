import { baca, tulis, pool } from '../../koneksi.js';
export async function tambahPengesahanCatatanUntukKunjunganBaru(fasyankes_id, entitas, entitas_id, versi, pengguna_id, hash, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `pengesahan_catatan` (`fasyankes_id`, `entitas`, `entitas_id`, `versi`, `pengguna_id`, `hash`) VALUES (?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (entitas === undefined ? null : entitas) ?? null, (entitas_id === undefined ? null : entitas_id) ?? null, (versi === undefined ? null : versi) ?? null, (pengguna_id === undefined ? null : pengguna_id) ?? null, (hash === undefined ? null : hash) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function ubahPengesahanCatatanUntukKlinisKlinisIntegrasiTest(waktu, entitas, entitas_id, koneksi = pool) {
    const hasil = await tulis("UPDATE `pengesahan_catatan` t SET `waktu` = IF(?, t.`waktu`, ?) WHERE ((? OR t.`entitas` <=> ?)) AND ((? OR t.`entitas_id` <=> ?))", [waktu === undefined, waktu ?? null, entitas === undefined, entitas ?? null, entitas_id === undefined, entitas_id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function hitungPengesahanCatatanUntukPenunjangPenunjangIntegrasiTest(entitas, entitas_id, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `pengesahan_catatan` t WHERE ((? OR t.`entitas` <=> ?)) AND ((? OR t.`entitas_id` <=> ?))", [entitas === undefined, entitas ?? null, entitas_id === undefined, entitas_id ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function daftarPengesahanCatatanUntukRekamMedisRmIntegrasiTest(entitas, entitas_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`entitas`, t.`entitas_id`, t.`versi`, t.`pengguna_id`, t.`jenis_akun_id`, t.`jenis_akun_nama`, t.`waktu`, t.`hash`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `pengesahan_catatan` t WHERE ((? OR t.`entitas` <=> ?)) AND ((? OR t.`entitas_id` <=> ?)) ORDER BY t.`versi` ASC", [entitas === undefined, entitas ?? null, entitas_id === undefined, entitas_id ?? null], koneksi);
    return baris;
}
export function hapusPengesahanCatatanFasyankesUji(ids, koneksi = pool) {
    return tulis('DELETE FROM `pengesahan_catatan` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
