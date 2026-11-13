import { tulis, pool } from '../koneksi.js';
export async function hapusIgBacaUntukBersihkanDalam(fasyankes_id, koneksi = pool) {
    const hasil = await tulis("DELETE t FROM `ig_baca` t WHERE (EXISTS (SELECT 1 FROM `ig_percakapan` r1 WHERE t.`percakapan_id` = r1.`id` AND (((? OR r1.`fasyankes_id` <=> ?)))))", [fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function simpanIgBacaUntukBuatRuteInstagram(percakapan_id, pengguna_id, pesan_id, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `ig_baca` (`percakapan_id`, `pengguna_id`, `pesan_id`) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE `percakapan_id` = `percakapan_id`", [(percakapan_id === undefined ? null : percakapan_id) ?? null, (pengguna_id === undefined ? null : pengguna_id) ?? null, (pesan_id === undefined ? 0 : pesan_id) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function ubahIgBacaUntukBuatRuteInstagram(pesan_id, percakapan_id, pengguna_id, koneksi = pool) {
    const hasil = await tulis("UPDATE `ig_baca` t SET `pesan_id` = IF(?, t.`pesan_id`, ?) WHERE ((? OR t.`percakapan_id` <=> ?)) AND ((? OR t.`pengguna_id` <=> ?)) AND ((? OR t.`pesan_id` < ?))", [pesan_id === undefined, pesan_id ?? null, percakapan_id === undefined, percakapan_id ?? null, pengguna_id === undefined, pengguna_id ?? null, pesan_id === undefined, pesan_id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
