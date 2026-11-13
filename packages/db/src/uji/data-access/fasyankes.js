import { baca, tulis, pool } from '../../koneksi.js';
export async function tambahFasyankesUntukAksesIzinIntegrasiTest(fasyankes_id, nama, jenis, kode_registrasi, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `fasyankes` (`fasyankes_id`, `nama`, `jenis`, `kode_registrasi`) VALUES (?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (nama === undefined ? null : nama) ?? null, ((jenis === undefined ? null : jenis) ?? null), (kode_registrasi === undefined ? null : kode_registrasi) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function tambahFasyankesUntukAksesIzinIntegrasiTestHasil(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`nama`, t.`jenis`, t.`bentuk_usaha`, t.`kode_registrasi`, t.`organization_id`, t.`status_akreditasi`, t.`tanggal_akreditasi`, t.`puskesmas_wilayah`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `fasyankes` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    if (!baris[0])
        throw new Error('Baris fasyankes tidak ditemukan.');
    return baris[0];
}
export async function ubahFasyankesUntukAksesIzinIntegrasiTest(fasyankes_id, koneksi = pool) {
    const hasil = await tulis("UPDATE `fasyankes` t SET `fasyankes_id` = IF(?, t.`fasyankes_id`, ?) WHERE ((? OR t.`id` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function hapusFasyankesUntukAksesIzinIntegrasiTest(id, koneksi = pool) {
    const hasil = await tulis("DELETE t FROM `fasyankes` t WHERE ((? OR t.`id` <=> ?))", [id === undefined, id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function hapusFasyankesUntukAksesRepositoriIntegrasiTest(id, koneksi = pool) {
    const hasil = await tulis("DELETE t FROM `fasyankes` t WHERE ((? OR t.`id` IN (?)))", [id === undefined, (id)?.length ? (id) : [null]], koneksi);
    return { count: hasil.affectedRows };
}
export async function wajibFasyankesUntukSrcSkemaTest(koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`nama`, t.`jenis`, t.`bentuk_usaha`, t.`kode_registrasi`, t.`organization_id`, t.`status_akreditasi`, t.`tanggal_akreditasi`, t.`puskesmas_wilayah`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `fasyankes` t WHERE TRUE LIMIT 1", [], koneksi);
    if (!baris[0])
        throw new Error('Baris fasyankes tidak ditemukan.');
    return baris[0];
}
