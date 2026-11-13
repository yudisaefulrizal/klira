import { baca, tulis, pool } from '../../koneksi.js';
export async function wajibObservasiUntukKlinisKlinisIntegrasiTest(kunjungan_id, bidang, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`kelompok`, t.`versi`, t.`bidang`, t.`kode_loinc`, t.`nilai`, t.`satuan_ucum`, t.`waktu`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `observasi` t WHERE ((? OR t.`kunjungan_id` <=> ?)) AND ((? OR t.`bidang` <=> ?)) LIMIT 1", [kunjungan_id === undefined, kunjungan_id ?? null, bidang === undefined, bidang ?? null], koneksi);
    if (!baris[0])
        throw new Error('Baris observasi tidak ditemukan.');
    return baris[0];
}
export async function ubahObservasiUntukKlinisKlinisIntegrasiTest(nilai, kunjungan_id, bidang, koneksi = pool) {
    const hasil = await tulis("UPDATE `observasi` t SET `nilai` = IF(?, t.`nilai`, ?) WHERE ((? OR t.`kunjungan_id` <=> ?)) AND ((? OR t.`bidang` <=> ?))", [nilai === undefined, nilai ?? null, kunjungan_id === undefined, kunjungan_id ?? null, bidang === undefined, bidang ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function hitungObservasiUntukKlinisKlinisIntegrasiTest(kunjungan_id, kelompok, bidang, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `observasi` t WHERE ((? OR t.`kunjungan_id` <=> ?)) AND ((? OR t.`kelompok` <=> ?)) AND ((? OR t.`bidang` <=> ?))", [kunjungan_id === undefined, kunjungan_id ?? null, kelompok === undefined, kelompok ?? null, bidang === undefined, bidang ?? null], koneksi);
    return Number(baris.jumlah);
}
export function hapusObservasiFasyankesUji(ids, koneksi = pool) {
    return tulis('DELETE FROM `observasi` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
