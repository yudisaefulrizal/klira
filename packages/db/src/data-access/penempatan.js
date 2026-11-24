import { baca, tulis, pool } from '../koneksi.js';
import { wajibId } from '../wajib.js';
export async function daftarPenempatanUntukBedSemua(selesai, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`kunjungan_id`, t.`lokasi_id`, t.`tarif_id`, t.`mulai`, t.`selesai`, t.`dibuat_oleh` FROM `penempatan` t WHERE ((? OR t.`selesai` <=> ?))", [selesai === undefined, selesai ?? null], koneksi);
    return baris;
}
export async function tambahPenempatanUntukTempatkan(kunjungan_id, lokasi_id, tarif_id, mulai, dibuat_oleh, koneksi = pool, ruang_nama = null, bed_nama = null) {
    const hasil = await tulis("INSERT INTO `penempatan` (`kunjungan_id`, `lokasi_id`, `ruang_nama`, `bed_nama`, `tarif_id`, `mulai`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?, ?)", [(kunjungan_id === undefined ? null : kunjungan_id) ?? null, (lokasi_id === undefined ? null : lokasi_id) ?? null, ruang_nama ?? null, bed_nama ?? null, (tarif_id === undefined ? null : tarif_id) ?? null, (mulai === undefined ? new Date() : mulai) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function daftarPenempatanUntukDetail(kunjungan_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`kunjungan_id`, t.`lokasi_id`, t.`ruang_nama`, t.`bed_nama`, t.`tarif_id`, t.`mulai`, t.`selesai`, t.`dibuat_oleh` FROM `penempatan` t WHERE ((? OR t.`kunjungan_id` <=> ?)) ORDER BY t.`id` ASC", [kunjungan_id === undefined, kunjungan_id ?? null], koneksi);
    return baris;
}
export async function cariPenempatanUntukUbahPenempatan(kunjungan_id, selesai, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`kunjungan_id`, t.`lokasi_id`, t.`tarif_id`, t.`mulai`, t.`selesai`, t.`dibuat_oleh` FROM `penempatan` t WHERE ((? OR t.`kunjungan_id` <=> ?)) AND ((? OR t.`selesai` <=> ?)) LIMIT 1", [kunjungan_id === undefined, kunjungan_id ?? null, selesai === undefined, selesai ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function ubahPenempatanUntukUbahPenempatan(selesai, id, koneksi = pool) {
    wajibId('ubahPenempatanUntukUbahPenempatan', id);
    const hasil = await tulis("UPDATE `penempatan` t SET `selesai` = IF(?, t.`selesai`, ?) WHERE ((? OR t.`id` <=> ?))", [selesai === undefined, selesai ?? null, id === undefined, id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function daftarPenempatanUntukPulangkan(kunjungan_id, selesai, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`kunjungan_id`, t.`lokasi_id`, t.`tarif_id`, t.`mulai`, t.`selesai`, t.`dibuat_oleh` FROM `penempatan` t WHERE ((? OR t.`kunjungan_id` <=> ?)) AND ((? OR t.`selesai` <=> ?))", [kunjungan_id === undefined, kunjungan_id ?? null, selesai === undefined, selesai ?? null], koneksi);
    return baris;
}
export async function daftarPenempatanUntukPulangkan2(kunjungan_id, tarif_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`kunjungan_id`, t.`lokasi_id`, t.`tarif_id`, t.`mulai`, t.`selesai`, t.`dibuat_oleh` FROM `penempatan` t WHERE ((? OR t.`kunjungan_id` <=> ?)) AND ((? OR NOT (t.`tarif_id` <=> ?)))", [kunjungan_id === undefined, kunjungan_id ?? null, tarif_id === undefined, tarif_id ?? null], koneksi);
    return baris;
}
export function kunciPenempatanAktif(lokasiId, koneksi) {
    return baca('SELECT id FROM penempatan WHERE lokasi_id = ? AND selesai IS NULL FOR UPDATE', [lokasiId], koneksi);
}
export async function hitungPenempatanLokasi(lokasiId, hanyaAktif = false, koneksi = pool) {
    const sql = hanyaAktif
        ? 'SELECT COUNT(*) AS jumlah FROM penempatan WHERE lokasi_id = ? AND selesai IS NULL'
        : 'SELECT COUNT(*) AS jumlah FROM penempatan WHERE lokasi_id = ?';
    const [baris] = await baca(sql, [lokasiId], koneksi);
    return Number(baris.jumlah);
}
export async function hitungBedAktifDalamRuang(ruangId, koneksi = pool) {
    const [baris] = await baca('SELECT COUNT(*) AS jumlah FROM penempatan p JOIN lokasi l ON l.id = p.lokasi_id WHERE l.induk_id = ? AND p.selesai IS NULL', [ruangId], koneksi);
    return Number(baris.jumlah);
}
