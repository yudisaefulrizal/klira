import { baca, tulis, pool } from '../koneksi.js';
export async function hitungIgPesanUntukBersihkanDalam(fasyankes_id, status, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `ig_pesan` t WHERE (EXISTS (SELECT 1 FROM `ig_percakapan` r1 WHERE t.`percakapan_id` = r1.`id` AND (((? OR r1.`fasyankes_id` <=> ?))))) AND ((? OR t.`status` IN (?)))", [fasyankes_id === undefined, fasyankes_id ?? null, status === undefined, (status)?.length ? (status) : [null]], koneksi);
    return Number(baris.jumlah);
}
export async function hapusIgPesanUntukBersihkanDalam(fasyankes_id, koneksi = pool) {
    const hasil = await tulis("DELETE t FROM `ig_pesan` t WHERE (EXISTS (SELECT 1 FROM `ig_percakapan` r1 WHERE t.`percakapan_id` = r1.`id` AND (((? OR r1.`fasyankes_id` <=> ?)))))", [fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function hitungIgPesanUntukBuatRuteInstagram(percakapan_id, arah, id, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `ig_pesan` t WHERE ((? OR t.`percakapan_id` <=> ?)) AND ((? OR t.`arah` <=> ?)) AND ((? OR t.`id` > ?))", [percakapan_id === undefined, percakapan_id ?? null, arah === undefined, arah ?? null, id === undefined, id ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function daftarIgPesanUntukBuatRuteInstagram(percakapan_id, batas, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`percakapan_id`, t.`ig_id`, t.`arah`, t.`isi`, t.`jenis`, t.`media_id`, t.`status`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `ig_pesan` t WHERE ((? OR t.`percakapan_id` <=> ?)) ORDER BY t.`id` DESC LIMIT ? OFFSET ?", [percakapan_id === undefined, percakapan_id ?? null, batas ?? 2147483647, 0], koneksi);
    return baris;
}
export async function cariIgPesanUntukBuatRuteInstagram(id, percakapan_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`percakapan_id`, t.`ig_id`, t.`arah`, t.`isi`, t.`jenis`, t.`media_id`, t.`status`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `ig_pesan` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`percakapan_id` <=> ?)) LIMIT 1", [id === undefined, id ?? null, percakapan_id === undefined, percakapan_id ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function tambahIgPesanUntukBuatRuteInstagram(percakapan_id, arah, isi, jenis, media_id, status, dibuat_oleh, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `ig_pesan` (`percakapan_id`, `arah`, `isi`, `jenis`, `media_id`, `status`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?, ?)", [(percakapan_id === undefined ? null : percakapan_id) ?? null, (arah === undefined ? null : arah) ?? null, (isi === undefined ? null : isi) ?? null, (jenis === undefined ? "text" : jenis) ?? null, (media_id === undefined ? null : media_id) ?? null, (status === undefined ? null : status) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function tambahIgPesanUntukBuatRuteInstagramHasil(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`percakapan_id`, t.`ig_id`, t.`arah`, t.`isi`, t.`jenis`, t.`media_id`, t.`status`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `ig_pesan` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    if (!baris[0])
        throw new Error('Baris ig_pesan tidak ditemukan.');
    return baris[0];
}
export async function ambilIgPesanUntukBuatRuteInstagram(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`percakapan_id`, t.`ig_id`, t.`arah`, t.`isi`, t.`jenis`, t.`media_id`, t.`status`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `ig_pesan` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function ambilIgPesanUntukBuatRuteInstagram2(ig_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`percakapan_id`, t.`ig_id`, t.`arah`, t.`isi`, t.`jenis`, t.`media_id`, t.`status`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `ig_pesan` t WHERE ((? OR t.`ig_id` <=> ?)) LIMIT 1", [ig_id === undefined, ig_id ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function hapusIgPesanUntukBuatRuteInstagram(id, koneksi = pool) {
    const hasil = await tulis("DELETE t FROM `ig_pesan` t WHERE ((? OR t.`id` <=> ?))", [id === undefined, id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function ubahIgPesanUntukBuatRuteInstagram(ig_id, status, id, koneksi = pool) {
    const hasil = await tulis("UPDATE `ig_pesan` t SET `ig_id` = IF(?, t.`ig_id`, ?), `status` = IF(?, t.`status`, ?) WHERE ((? OR t.`id` <=> ?))", [ig_id === undefined, ig_id ?? null, status === undefined, status ?? null, id === undefined, id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function ubahIgPesanUntukBuatRuteInstagram2(status, id, koneksi = pool) {
    const hasil = await tulis("UPDATE `ig_pesan` t SET `status` = IF(?, t.`status`, ?) WHERE ((? OR t.`id` <=> ?))", [status === undefined, status ?? null, id === undefined, id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function tambahIgPesanUntukWebhookInstagram(percakapan_id, ig_id, arah, isi, jenis, media_id, status, dibuat_pada, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `ig_pesan` (`percakapan_id`, `ig_id`, `arah`, `isi`, `jenis`, `media_id`, `status`, `dibuat_pada`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [(percakapan_id === undefined ? null : percakapan_id) ?? null, (ig_id === undefined ? null : ig_id) ?? null, (arah === undefined ? null : arah) ?? null, (isi === undefined ? null : isi) ?? null, (jenis === undefined ? "text" : jenis) ?? null, (media_id === undefined ? null : media_id) ?? null, (status === undefined ? null : status) ?? null, (dibuat_pada === undefined ? new Date() : dibuat_pada) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function daftarIgPesanUntukPulihkanPengirimanInstagram(arah, status, dibuat_pada, batas, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`percakapan_id` FROM `ig_pesan` t WHERE ((? OR t.`arah` <=> ?)) AND ((? OR t.`status` <=> ?)) AND ((? OR t.`dibuat_pada` < ?)) LIMIT ? OFFSET ?", [arah === undefined, arah ?? null, status === undefined, status ?? null, dibuat_pada === undefined, dibuat_pada ?? null, batas ?? 2147483647, 0], koneksi);
    return baris;
}
export async function ubahIgPesanUntukPulihkanPengirimanInstagram(status, id, status2, dibuat_pada, koneksi = pool) {
    const hasil = await tulis("UPDATE `ig_pesan` t SET `status` = IF(?, t.`status`, ?) WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`status` <=> ?)) AND ((? OR t.`dibuat_pada` < ?))", [status === undefined, status ?? null, id === undefined, id ?? null, status2 === undefined, status2 ?? null, dibuat_pada === undefined, dibuat_pada ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function daftarIgPesanUntukPangkasPesanInstagram(percakapan_id, status, lewati, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`media_id` FROM `ig_pesan` t WHERE ((? OR t.`percakapan_id` <=> ?)) AND ((? OR t.`status` NOT IN (?))) ORDER BY t.`id` DESC LIMIT ? OFFSET ?", [percakapan_id === undefined, percakapan_id ?? null, (status === undefined) || !(status)?.length, (status)?.length ? (status) : [null], 2147483647, lewati ?? 0], koneksi);
    return baris;
}
export async function hapusIgPesanUntukPangkasPesanInstagram(id, status, koneksi = pool) {
    const hasil = await tulis("DELETE t FROM `ig_pesan` t WHERE ((? OR t.`id` IN (?))) AND ((? OR t.`status` NOT IN (?)))", [id === undefined, (id)?.length ? (id) : [null], (status === undefined) || !(status)?.length, (status)?.length ? (status) : [null]], koneksi);
    return { count: hasil.affectedRows };
}
export async function daftarIgPesanUntukPangkasPesanInstagram2(media_id, koneksi = pool) {
    const baris = await baca("SELECT t.`media_id` FROM `ig_pesan` t WHERE ((? OR t.`media_id` IN (?)))", [media_id === undefined, (media_id)?.length ? (media_id) : [null]], koneksi);
    return baris;
}
