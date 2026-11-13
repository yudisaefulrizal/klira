import { baca, tulis, pool } from '../../koneksi.js';
export async function hapusSesiUntukAksesIzinIntegrasiTest(pengguna_id, koneksi = pool) {
    const hasil = await tulis("DELETE t FROM `sesi` t WHERE ((? OR t.`pengguna_id` IN (?)))", [pengguna_id === undefined, (pengguna_id)?.length ? (pengguna_id) : [null]], koneksi);
    return { count: hasil.affectedRows };
}
export async function daftarSesiUntukAksesRepositoriIntegrasiTest(pengguna_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`pengguna_id`, t.`id_hash`, t.`alamat`, t.`dibuat_pada`, t.`kedaluwarsa_pada` FROM `sesi` t WHERE ((? OR t.`pengguna_id` <=> ?))", [pengguna_id === undefined, pengguna_id ?? null], koneksi);
    return baris;
}
export async function cariSesiUntukKeamananKeamananIntegrasiTest(pengguna_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`pengguna_id`, t.`id_hash`, t.`alamat`, t.`dibuat_pada`, t.`kedaluwarsa_pada` FROM `sesi` t WHERE ((? OR t.`pengguna_id` <=> ?)) ORDER BY t.`id` DESC LIMIT 1", [pengguna_id === undefined, pengguna_id ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function hapusSesiUntukPenggunaPembuatanIntegrasiTest(fasyankes_id, koneksi = pool) {
    const hasil = await tulis("DELETE t FROM `sesi` t WHERE (EXISTS (SELECT 1 FROM `pengguna` r1 WHERE t.`pengguna_id` = r1.`id` AND (((? OR r1.`fasyankes_id` <=> ?)))))", [fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
