import { baca, tulis, pool } from '../koneksi.js';
export async function hitungPembayaranUntukSinkronItemTindakanDalam(tagihan_id, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `pembayaran` t WHERE ((? OR t.`tagihan_id` <=> ?))", [tagihan_id === undefined, tagihan_id ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function hitungPembayaranUntukAsal(kunjungan_id, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `pembayaran` t WHERE (EXISTS (SELECT 1 FROM `tagihan` r1 WHERE t.`tagihan_id` = r1.`id` AND (((? OR r1.`kunjungan_id` <=> ?)))))", [kunjungan_id === undefined, kunjungan_id ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function hitungPembayaranUntukCatatTelaah(kunjungan_id, fasyankes_id, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `pembayaran` t WHERE (EXISTS (SELECT 1 FROM `tagihan` r1 WHERE t.`tagihan_id` = r1.`id` AND (((? OR r1.`kunjungan_id` <=> ?)) AND ((? OR r1.`fasyankes_id` <=> ?)))))", [kunjungan_id === undefined, kunjungan_id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function kelompokPembayaranUntukKeShiftDto(fasyankes_id, shift_id, koneksi = pool) {
    const baris = await baca("SELECT t.`shift_id`, t.`metode`, COUNT(*) AS `_count__all`, SUM(t.`jumlah`) AS `_sum_jumlah` FROM `pembayaran` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`shift_id` IN (?))) GROUP BY t.`shift_id`, t.`metode`", [fasyankes_id === undefined, fasyankes_id ?? null, shift_id === undefined, (shift_id)?.length ? (shift_id) : [null]], koneksi);
    const hasil = baris.map(b => ({ shift_id: b.shift_id, metode: b.metode, _count: { _all: Number(b._count__all) }, _sum: { jumlah: b._sum_jumlah === null ? null : Number(b._sum_jumlah) } }));
    return hasil;
}
export async function kelompokPembayaranUntukRekap(fasyankes_id, waktu, waktu2, koneksi = pool) {
    const baris = await baca("SELECT t.`metode`, COUNT(*) AS `_count__all`, SUM(t.`jumlah`) AS `_sum_jumlah` FROM `pembayaran` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`waktu` >= ?) AND (? OR t.`waktu` < ?)) GROUP BY t.`metode`", [fasyankes_id === undefined, fasyankes_id ?? null, waktu === undefined, waktu ?? null, waktu2 === undefined, waktu2 ?? null], koneksi);
    const hasil = baris.map(b => ({ metode: b.metode, _count: { _all: Number(b._count__all) }, _sum: { jumlah: b._sum_jumlah === null ? null : Number(b._sum_jumlah) } }));
    return hasil;
}
export async function tambahPembayaranUntukBayar(fasyankes_id, tagihan_id, shift_id, metode, jumlah, kasir_id, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `pembayaran` (`fasyankes_id`, `tagihan_id`, `shift_id`, `metode`, `jumlah`, `kasir_id`) VALUES (?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (tagihan_id === undefined ? null : tagihan_id) ?? null, (shift_id === undefined ? null : shift_id) ?? null, ((metode === undefined ? null : metode) ?? null), (jumlah === undefined ? null : jumlah) ?? null, (kasir_id === undefined ? null : kasir_id) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function tambahPembayaranUntukBayarHasil(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`tagihan_id`, t.`shift_id`, t.`metode`, t.`jumlah`, t.`waktu`, t.`kasir_id` FROM `pembayaran` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    if (!baris[0])
        throw new Error('Baris pembayaran tidak ditemukan.');
    return baris[0];
}
