import { baca, tulis, pool } from '../koneksi.js';
export async function daftarIgMediaUntukBersihkanDalam(fasyankes_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id` FROM `ig_media` t WHERE ((? OR t.`fasyankes_id` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return baris;
}
export async function hapusIgMediaUntukBersihkanDalam(fasyankes_id, koneksi = pool) {
    const hasil = await tulis("DELETE t FROM `ig_media` t WHERE ((? OR t.`fasyankes_id` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function tambahIgMediaUntukBuatRuteInstagram(id, fasyankes_id, isi, mime, nama, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `ig_media` (`id`, `fasyankes_id`, `isi`, `mime`, `nama`) VALUES (?, ?, ?, ?, ?)", [(id === undefined ? null : id) ?? null, (fasyankes_id === undefined ? null : fasyankes_id) ?? null, (isi === undefined ? null : isi) ?? null, (mime === undefined ? null : mime) ?? null, (nama === undefined ? null : nama) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function hapusIgMediaUntukBuatRuteInstagram(id, koneksi = pool) {
    const hasil = await tulis("DELETE t FROM `ig_media` t WHERE ((? OR t.`id` <=> ?))", [id === undefined, id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function cariIgMediaUntukBuatRuteInstagram(id, fasyankes_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`isi`, t.`mime`, t.`nama` FROM `ig_media` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) LIMIT 1", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function hapusIgMediaUntukPangkasPesanInstagram(id, koneksi = pool) {
    const hasil = await tulis("DELETE t FROM `ig_media` t WHERE ((? OR t.`id` IN (?)))", [id === undefined, (id)?.length ? (id) : [null]], koneksi);
    return { count: hasil.affectedRows };
}
