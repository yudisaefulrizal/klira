import { baca, tulis, pool } from '../../koneksi.js';
export async function tambahTagihanUntukSiapkan(fasyankes_id, kunjungan_id, status_tagihan, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `tagihan` (`fasyankes_id`, `kunjungan_id`, `status_tagihan`) VALUES (?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (kunjungan_id === undefined ? null : kunjungan_id) ?? null, ((status_tagihan === undefined ? "belum_lengkap" : status_tagihan) ?? null)], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function tambahTagihanUntukSiapkanHasil(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`status_tagihan`, t.`status_pembayaran`, t.`dibuat_oleh`, t.`dibuat_pada`, t.`alasan_tutup_belum_lunas` FROM `tagihan` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    if (!baris[0])
        throw new Error('Baris tagihan tidak ditemukan.');
    return baris[0];
}
export async function ambilTagihanUntukKasirKasirIntegrasiTest(kunjungan_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`status_tagihan`, t.`status_pembayaran`, t.`dibuat_oleh`, t.`dibuat_pada`, t.`alasan_tutup_belum_lunas` FROM `tagihan` t WHERE ((? OR t.`kunjungan_id` <=> ?)) LIMIT 1", [kunjungan_id === undefined, kunjungan_id ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function wajibTagihanUntukKasirKasirIntegrasiTest(kunjungan_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`status_tagihan`, t.`status_pembayaran`, t.`dibuat_oleh`, t.`dibuat_pada`, t.`alasan_tutup_belum_lunas` FROM `tagihan` t WHERE ((? OR t.`kunjungan_id` <=> ?)) LIMIT 1", [kunjungan_id === undefined, kunjungan_id ?? null], koneksi);
    if (!baris[0])
        throw new Error('Baris tagihan tidak ditemukan.');
    return baris[0];
}
export async function hitungTagihanUntukPenunjangPenunjangIntegrasiTest(kunjungan_id, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `tagihan` t WHERE ((? OR t.`kunjungan_id` <=> ?))", [kunjungan_id === undefined, kunjungan_id ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function hapusTagihanUntukRawatInapRawatInapIntegrasiTest(fasyankes_id, koneksi = pool) {
    const hasil = await tulis("DELETE t FROM `tagihan` t WHERE ((? OR t.`fasyankes_id` IN (?)))", [fasyankes_id === undefined, (fasyankes_id)?.length ? (fasyankes_id) : [null]], koneksi);
    return { count: hasil.affectedRows };
}
export async function tambahTagihanUntukRawatInapRawatInapIntegrasiTest(fasyankes_id, kunjungan_id, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `tagihan` (`fasyankes_id`, `kunjungan_id`) VALUES (?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (kunjungan_id === undefined ? null : kunjungan_id) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export function hapusTagihanFasyankesUji(ids, koneksi = pool) {
    return tulis('DELETE FROM `tagihan` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
