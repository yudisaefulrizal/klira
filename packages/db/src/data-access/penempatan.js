import { baca, tulis, pool } from '../koneksi.js';
export async function daftarPenempatanUntukBedSemua(fasyankes_id, selesai, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`lokasi_id`, t.`kelas`, t.`indikator`, t.`tarif_id`, t.`mulai`, t.`selesai`, t.`dibuat_oleh` FROM `penempatan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`selesai` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null, selesai === undefined, selesai ?? null], koneksi);
    return baris;
}
export async function tambahPenempatanUntukTempatkan(fasyankes_id, kunjungan_id, lokasi_id, kelas, indikator, tarif_id, mulai, dibuat_oleh, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `penempatan` (`fasyankes_id`, `kunjungan_id`, `lokasi_id`, `kelas`, `indikator`, `tarif_id`, `mulai`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (kunjungan_id === undefined ? null : kunjungan_id) ?? null, (lokasi_id === undefined ? null : lokasi_id) ?? null, ((kelas === undefined ? null : kelas) ?? null), ((indikator === undefined ? "kelas_tetap" : indikator) ?? null), (tarif_id === undefined ? null : tarif_id) ?? null, (mulai === undefined ? new Date() : mulai) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function daftarPenempatanUntukDetail(kunjungan_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`lokasi_id`, t.`kelas`, t.`indikator`, t.`tarif_id`, t.`mulai`, t.`selesai`, t.`dibuat_oleh` FROM `penempatan` t WHERE ((? OR t.`kunjungan_id` <=> ?)) ORDER BY t.`id` ASC", [kunjungan_id === undefined, kunjungan_id ?? null], koneksi);
    return baris;
}
export async function cariPenempatanUntukUbahPenempatan(kunjungan_id, selesai, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`lokasi_id`, t.`kelas`, t.`indikator`, t.`tarif_id`, t.`mulai`, t.`selesai`, t.`dibuat_oleh` FROM `penempatan` t WHERE ((? OR t.`kunjungan_id` <=> ?)) AND ((? OR t.`selesai` <=> ?)) LIMIT 1", [kunjungan_id === undefined, kunjungan_id ?? null, selesai === undefined, selesai ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function ubahPenempatanUntukUbahPenempatan(selesai, id, koneksi = pool) {
    const hasil = await tulis("UPDATE `penempatan` t SET `selesai` = IF(?, t.`selesai`, ?) WHERE ((? OR t.`id` <=> ?))", [selesai === undefined, selesai ?? null, id === undefined, id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function daftarPenempatanUntukPulangkan(kunjungan_id, selesai, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`lokasi_id`, t.`kelas`, t.`indikator`, t.`tarif_id`, t.`mulai`, t.`selesai`, t.`dibuat_oleh` FROM `penempatan` t WHERE ((? OR t.`kunjungan_id` <=> ?)) AND ((? OR t.`selesai` <=> ?))", [kunjungan_id === undefined, kunjungan_id ?? null, selesai === undefined, selesai ?? null], koneksi);
    return baris;
}
export async function daftarPenempatanUntukPulangkan2(kunjungan_id, tarif_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`lokasi_id`, t.`kelas`, t.`indikator`, t.`tarif_id`, t.`mulai`, t.`selesai`, t.`dibuat_oleh` FROM `penempatan` t WHERE ((? OR t.`kunjungan_id` <=> ?)) AND ((? OR NOT (t.`tarif_id` <=> ?)))", [kunjungan_id === undefined, kunjungan_id ?? null, tarif_id === undefined, tarif_id ?? null], koneksi);
    return baris;
}
export function kunciPenempatanAktif(fasyankesId, lokasiId, koneksi) {
    return baca('SELECT id FROM penempatan WHERE fasyankes_id = ? AND lokasi_id = ? AND selesai IS NULL FOR UPDATE', [fasyankesId, lokasiId], koneksi);
}
