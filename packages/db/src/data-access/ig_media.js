import { baca, tulis, pool } from '../koneksi.js';
export async function daftarIgMediaUntukBersihkanDalam(koneksi = pool) {
    const baris = await baca("SELECT t.`id` FROM `ig_media` t WHERE TRUE", [], koneksi);
    return baris;
}
export async function hapusIgMediaUntukBersihkanDalam(koneksi = pool) {
    const hasil = await tulis("DELETE t FROM `ig_media` t WHERE TRUE", [], koneksi);
    return { count: hasil.affectedRows };
}
export async function tambahIgMediaUntukBuatRuteInstagram(id, isi, mime, nama, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `ig_media` (`id`, `isi`, `mime`, `nama`) VALUES (?, ?, ?, ?, ?)", [(id === undefined ? null : id) ?? null, (isi === undefined ? null : isi) ?? null, (mime === undefined ? null : mime) ?? null, (nama === undefined ? null : nama) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function hapusIgMediaUntukBuatRuteInstagram(id, koneksi = pool) {
    const hasil = await tulis("DELETE t FROM `ig_media` t WHERE ((? OR t.`id` <=> ?))", [id === undefined, id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function cariIgMediaUntukBuatRuteInstagram(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`isi`, t.`mime`, t.`nama` FROM `ig_media` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function hapusIgMediaUntukPangkasPesanInstagram(id, koneksi = pool) {
    const hasil = await tulis("DELETE t FROM `ig_media` t WHERE ((? OR t.`id` IN (?)))", [id === undefined, (id)?.length ? (id) : [null]], koneksi);
    return { count: hasil.affectedRows };
}
