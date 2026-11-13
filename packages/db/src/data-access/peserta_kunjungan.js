import { baca, tulis, pool } from '../koneksi.js';
export async function tambahPesertaKunjunganUntukDaftarkan(fasyankes_id, kunjungan_id, pengguna_id, tipe, mulai, dibuat_oleh, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `peserta_kunjungan` (`fasyankes_id`, `kunjungan_id`, `pengguna_id`, `tipe`, `mulai`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (kunjungan_id === undefined ? null : kunjungan_id) ?? null, (pengguna_id === undefined ? null : pengguna_id) ?? null, ((tipe === undefined ? null : tipe) ?? null), (mulai === undefined ? new Date() : mulai) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function daftarPesertaKunjunganUntukDetail(kunjungan_id, selesai, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`pengguna_id`, t.`tipe`, t.`mulai`, t.`selesai`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `peserta_kunjungan` t WHERE ((? OR t.`kunjungan_id` <=> ?)) AND ((? OR t.`selesai` <=> ?)) ORDER BY t.`id` ASC", [kunjungan_id === undefined, kunjungan_id ?? null, selesai === undefined, selesai ?? null], koneksi);
    return baris;
}
export async function daftarPesertaKunjunganUntukTerapkanDpjp(kunjungan_id, selesai, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`pengguna_id`, t.`tipe`, t.`mulai`, t.`selesai`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `peserta_kunjungan` t WHERE ((? OR t.`kunjungan_id` <=> ?)) AND ((? OR t.`selesai` <=> ?))", [kunjungan_id === undefined, kunjungan_id ?? null, selesai === undefined, selesai ?? null], koneksi);
    return baris;
}
export async function ubahPesertaKunjunganUntukTerapkanDpjp(selesai, id, koneksi = pool) {
    const hasil = await tulis("UPDATE `peserta_kunjungan` t SET `selesai` = IF(?, t.`selesai`, ?) WHERE ((? OR t.`id` <=> ?))", [selesai === undefined, selesai ?? null, id === undefined, id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function ubahPesertaKunjunganUntukPulangkan(selesai, kunjungan_id, selesai2, koneksi = pool) {
    const hasil = await tulis("UPDATE `peserta_kunjungan` t SET `selesai` = IF(?, t.`selesai`, ?) WHERE ((? OR t.`kunjungan_id` <=> ?)) AND ((? OR t.`selesai` <=> ?))", [selesai === undefined, selesai ?? null, kunjungan_id === undefined, kunjungan_id ?? null, selesai2 === undefined, selesai2 ?? null], koneksi);
    return { count: hasil.affectedRows };
}
