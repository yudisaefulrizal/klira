import { baca, tulis, pool } from '../../koneksi.js';
export async function hitungPembayaranUntukKasirKasirIntegrasiTest(fasyankes_id, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `pembayaran` t WHERE ((? OR t.`fasyankes_id` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function hitungPembayaranUntukKasirKasirIntegrasiTest2(kunjungan_id, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `pembayaran` t WHERE (EXISTS (SELECT 1 FROM `tagihan` r1 WHERE t.`tagihan_id` = r1.`id` AND (((? OR r1.`kunjungan_id` <=> ?)))))", [kunjungan_id === undefined, kunjungan_id ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function ringkasanPembayaranUntukKasirKasirIntegrasiTest(fasyankes_id, kunjungan_id, koneksi = pool) {
    const baris = await baca("SELECT SUM(t.`jumlah`) AS `_sum_jumlah` FROM `pembayaran` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND (EXISTS (SELECT 1 FROM `tagihan` r1 WHERE t.`tagihan_id` = r1.`id` AND (((? OR r1.`kunjungan_id` <=> ?)))))", [fasyankes_id === undefined, fasyankes_id ?? null, kunjungan_id === undefined, kunjungan_id ?? null], koneksi);
    const hasil = baris.map(b => ({ _sum: { jumlah: b._sum_jumlah === null ? null : Number(b._sum_jumlah) } }));
    return hasil[0];
}
export async function hapusPembayaranUntukRawatInapRawatInapIntegrasiTest(fasyankes_id, koneksi = pool) {
    const hasil = await tulis("DELETE t FROM `pembayaran` t WHERE ((? OR t.`fasyankes_id` IN (?)))", [fasyankes_id === undefined, (fasyankes_id)?.length ? (fasyankes_id) : [null]], koneksi);
    return { count: hasil.affectedRows };
}
export async function tambahPembayaranUntukRawatInapRawatInapIntegrasiTest(fasyankes_id, tagihan_id, shift_id, metode, jumlah, kasir_id, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `pembayaran` (`fasyankes_id`, `tagihan_id`, `shift_id`, `metode`, `jumlah`, `kasir_id`) VALUES (?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (tagihan_id === undefined ? null : tagihan_id) ?? null, (shift_id === undefined ? null : shift_id) ?? null, ((metode === undefined ? null : metode) ?? null), (jumlah === undefined ? null : jumlah) ?? null, (kasir_id === undefined ? null : kasir_id) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function hapusPembayaranUntukRawatInapRawatInapIntegrasiTest2(tagihan_id, koneksi = pool) {
    const hasil = await tulis("DELETE t FROM `pembayaran` t WHERE ((? OR t.`tagihan_id` <=> ?))", [tagihan_id === undefined, tagihan_id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export function hapusPembayaranFasyankesUji(ids, koneksi = pool) {
    return tulis('DELETE FROM `pembayaran` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
