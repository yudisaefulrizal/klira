import { baca, tulis, pool } from '../../koneksi.js';
export async function hitungItemTagihanUntukFarmasiFarmasiIntegrasiTest(fasyankes_id, item_resep_id, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `item_tagihan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR NOT (t.`item_resep_id` <=> ?)))", [fasyankes_id === undefined, fasyankes_id ?? null, item_resep_id === undefined, item_resep_id ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function daftarItemTagihanUntukFarmasiFarmasiIntegrasiTest(fasyankes_id, item_resep_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`tagihan_id`, t.`jenis`, t.`tarif_layanan_id`, t.`kode`, t.`nama`, t.`jumlah`, t.`harga`, t.`order_penunjang_id`, t.`item_resep_id`, t.`manual`, t.`tindakan_sumber`, t.`harga_acuan`, t.`alasan_ubah_harga`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `item_tagihan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR NOT (t.`item_resep_id` <=> ?))) ORDER BY t.`id` ASC", [fasyankes_id === undefined, fasyankes_id ?? null, item_resep_id === undefined, item_resep_id ?? null], koneksi);
    return baris;
}
export async function tambahItemTagihanUntukSiapkan(fasyankes_id, tagihan_id, jenis, kode, nama, jumlah, harga, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `item_tagihan` (`fasyankes_id`, `tagihan_id`, `jenis`, `kode`, `nama`, `jumlah`, `harga`) VALUES (?, ?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (tagihan_id === undefined ? null : tagihan_id) ?? null, ((jenis === undefined ? null : jenis) ?? null), (kode === undefined ? null : kode) ?? null, (nama === undefined ? null : nama) ?? null, (jumlah === undefined ? 1 : jumlah) ?? null, (harga === undefined ? null : harga) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function daftarItemTagihanUntukKasirKasirIntegrasiTest(kunjungan_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`tagihan_id`, t.`jenis`, t.`tarif_layanan_id`, t.`kode`, t.`nama`, t.`jumlah`, t.`harga`, t.`order_penunjang_id`, t.`item_resep_id`, t.`manual`, t.`tindakan_sumber`, t.`harga_acuan`, t.`alasan_ubah_harga`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `item_tagihan` t WHERE (EXISTS (SELECT 1 FROM `tagihan` r1 WHERE t.`tagihan_id` = r1.`id` AND (((? OR r1.`kunjungan_id` <=> ?))))) ORDER BY t.`id` ASC", [kunjungan_id === undefined, kunjungan_id ?? null], koneksi);
    return baris;
}
export async function wajibItemTagihanUntukKasirKasirIntegrasiTest(kunjungan_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`tagihan_id`, t.`jenis`, t.`tarif_layanan_id`, t.`kode`, t.`nama`, t.`jumlah`, t.`harga`, t.`order_penunjang_id`, t.`item_resep_id`, t.`manual`, t.`tindakan_sumber`, t.`harga_acuan`, t.`alasan_ubah_harga`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `item_tagihan` t WHERE (EXISTS (SELECT 1 FROM `tagihan` r1 WHERE t.`tagihan_id` = r1.`id` AND (((? OR r1.`kunjungan_id` <=> ?))))) LIMIT 1", [kunjungan_id === undefined, kunjungan_id ?? null], koneksi);
    if (!baris[0])
        throw new Error('Baris item_tagihan tidak ditemukan.');
    return baris[0];
}
export async function wajibItemTagihanUntukKasirKasirIntegrasiTest2(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`tagihan_id`, t.`jenis`, t.`tarif_layanan_id`, t.`kode`, t.`nama`, t.`jumlah`, t.`harga`, t.`order_penunjang_id`, t.`item_resep_id`, t.`manual`, t.`tindakan_sumber`, t.`harga_acuan`, t.`alasan_ubah_harga`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `item_tagihan` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    if (!baris[0])
        throw new Error('Baris item_tagihan tidak ditemukan.');
    return baris[0];
}
export async function hapusItemTagihanUntukRawatInapRawatInapIntegrasiTest(fasyankes_id, koneksi = pool) {
    const hasil = await tulis("DELETE t FROM `item_tagihan` t WHERE ((? OR t.`fasyankes_id` IN (?)))", [fasyankes_id === undefined, (fasyankes_id)?.length ? (fasyankes_id) : [null]], koneksi);
    return { count: hasil.affectedRows };
}
export async function wajibItemTagihanUntukRawatInapRawatInapIntegrasiTest(kunjungan_id, jenis, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`tagihan_id`, t.`jenis`, t.`tarif_layanan_id`, t.`kode`, t.`nama`, t.`jumlah`, t.`harga`, t.`order_penunjang_id`, t.`item_resep_id`, t.`manual`, t.`tindakan_sumber`, t.`harga_acuan`, t.`alasan_ubah_harga`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `item_tagihan` t WHERE (EXISTS (SELECT 1 FROM `tagihan` r1 WHERE t.`tagihan_id` = r1.`id` AND (((? OR r1.`kunjungan_id` <=> ?))))) AND ((? OR t.`jenis` <=> ?)) LIMIT 1", [kunjungan_id === undefined, kunjungan_id ?? null, jenis === undefined, jenis ?? null], koneksi);
    if (!baris[0])
        throw new Error('Baris item_tagihan tidak ditemukan.');
    return baris[0];
}
export async function tambahItemTagihanUntukRawatInapRawatInapIntegrasiTest(fasyankes_id, tagihan_id, jenis, kode, nama, harga, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `item_tagihan` (`fasyankes_id`, `tagihan_id`, `jenis`, `kode`, `nama`, `harga`) VALUES (?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (tagihan_id === undefined ? null : tagihan_id) ?? null, ((jenis === undefined ? null : jenis) ?? null), (kode === undefined ? null : kode) ?? null, (nama === undefined ? null : nama) ?? null, (harga === undefined ? null : harga) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function hitungItemTagihanUntukRawatInapRawatInapIntegrasiTest(kunjungan_id, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `item_tagihan` t WHERE (EXISTS (SELECT 1 FROM `tagihan` r1 WHERE t.`tagihan_id` = r1.`id` AND (((? OR r1.`kunjungan_id` <=> ?)))))", [kunjungan_id === undefined, kunjungan_id ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function hitungItemTagihanUntukRawatInapRawatInapIntegrasiTest2(tagihan_id, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `item_tagihan` t WHERE ((? OR t.`tagihan_id` <=> ?))", [tagihan_id === undefined, tagihan_id ?? null], koneksi);
    return Number(baris.jumlah);
}
export function hapusItemTagihanFasyankesUji(ids, koneksi = pool) {
    return tulis('DELETE FROM `item_tagihan` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
