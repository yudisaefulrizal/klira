import { baca, tulis, pool } from '../../koneksi.js';
export async function hapusTarifLayananUntukMasterMasterIntegrasiTest(fasyankes_id, koneksi = pool) {
    const hasil = await tulis("DELETE t FROM `tarif_layanan` t WHERE ((? OR t.`fasyankes_id` IN (?)))", [fasyankes_id === undefined, (fasyankes_id)?.length ? (fasyankes_id) : [null]], koneksi);
    return { count: hasil.affectedRows };
}
export async function tambahTarifLayananUntukPenunjangPenunjangIntegrasiTest(fasyankes_id, kode, nama, jenis, harga_umum, harga_jkn, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `tarif_layanan` (`fasyankes_id`, `kode`, `nama`, `jenis`, `harga_umum`, `harga_jkn`) VALUES (?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (kode === undefined ? null : kode) ?? null, (nama === undefined ? null : nama) ?? null, ((jenis === undefined ? null : jenis) ?? null), (harga_umum === undefined ? null : harga_umum) ?? null, (harga_jkn === undefined ? null : harga_jkn) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function tambahTarifLayananUntukPenunjangPenunjangIntegrasiTestHasil(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`kode`, t.`nama`, t.`jenis`, t.`harga_umum`, t.`harga_jkn`, t.`kode_icd9cm`, t.`aktif`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `tarif_layanan` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    if (!baris[0])
        throw new Error('Baris tarif_layanan tidak ditemukan.');
    return baris[0];
}
export async function wajibTarifLayananUntukPenunjangPenunjangIntegrasiTest(fasyankes_id, kode, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`kode`, t.`nama`, t.`jenis`, t.`harga_umum`, t.`harga_jkn`, t.`kode_icd9cm`, t.`aktif`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `tarif_layanan` t WHERE (((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`kode` <=> ?))) LIMIT 1", [fasyankes_id === undefined, fasyankes_id ?? null, kode === undefined, kode ?? null], koneksi);
    if (!baris[0])
        throw new Error('Baris tarif_layanan tidak ditemukan.');
    return baris[0];
}
export async function hitungTarifLayananUntukPenunjangPenunjangIntegrasiTest(fasyankes_id, kode, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `tarif_layanan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`kode` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null, kode === undefined, kode ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function tambahTarifLayananUntukPenunjangPenunjangIntegrasiTest2(fasyankes_id, kode, nama, jenis, harga_umum, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `tarif_layanan` (`fasyankes_id`, `kode`, `nama`, `jenis`, `harga_umum`) VALUES (?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (kode === undefined ? null : kode) ?? null, (nama === undefined ? null : nama) ?? null, ((jenis === undefined ? null : jenis) ?? null), (harga_umum === undefined ? null : harga_umum) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export function hapusTarifLayananFasyankesUji(ids, koneksi = pool) {
    return tulis('DELETE FROM `tarif_layanan` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
