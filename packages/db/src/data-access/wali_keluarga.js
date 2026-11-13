import { baca, tulis, pool } from '../koneksi.js';
export async function daftarWaliKeluargaUntukPerbaiki(pasien_id, fasyankes_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id` FROM `wali_keluarga` t WHERE ((? OR t.`pasien_id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?))", [pasien_id === undefined, pasien_id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return baris;
}
export async function ubahWaliKeluargaUntukPerbaiki(hubungan, nama, kontak, id, pasien_id, fasyankes_id, koneksi = pool) {
    const hasil = await tulis("UPDATE `wali_keluarga` t SET `hubungan` = IF(?, t.`hubungan`, ?), `nama` = IF(?, t.`nama`, ?), `kontak` = IF(?, t.`kontak`, ?) WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`pasien_id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?))", [hubungan === undefined, hubungan ?? null, nama === undefined, nama ?? null, kontak === undefined, kontak ?? null, id === undefined, id ?? null, pasien_id === undefined, pasien_id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function tambahWaliKeluargaUntukPerbaiki(fasyankes_id, pasien_id, hubungan, nama, kontak, dibuat_oleh, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `wali_keluarga` (`fasyankes_id`, `pasien_id`, `hubungan`, `nama`, `kontak`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (pasien_id === undefined ? null : pasien_id) ?? null, (hubungan === undefined ? null : hubungan) ?? null, (nama === undefined ? null : nama) ?? null, (kontak === undefined ? null : kontak) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function tambahWaliKeluargaUntukDaftarkanHasil(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`pasien_id`, t.`hubungan`, t.`nama`, t.`kontak`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `wali_keluarga` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    if (!baris[0])
        throw new Error('Baris wali_keluarga tidak ditemukan.');
    return baris[0];
}
export async function daftarWaliKeluargaUntukFolderKeluarga(fasyankes_id, pasien_id, batas, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`pasien_id`, t.`hubungan`, t.`nama`, t.`kontak`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `wali_keluarga` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`pasien_id` <=> ?)) ORDER BY t.`id` ASC LIMIT ? OFFSET ?", [fasyankes_id === undefined, fasyankes_id ?? null, pasien_id === undefined, pasien_id ?? null, batas ?? 2147483647, 0], koneksi);
    return baris;
}
export async function daftarWaliKeluargaUntukWali(fasyankes_id, pasien_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`hubungan`, t.`nama` FROM `wali_keluarga` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`pasien_id` <=> ?)) ORDER BY t.`id` ASC", [fasyankes_id === undefined, fasyankes_id ?? null, pasien_id === undefined, pasien_id ?? null], koneksi);
    return baris;
}
