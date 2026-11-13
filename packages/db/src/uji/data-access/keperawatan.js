import { baca, tulis, pool } from '../../koneksi.js';
export async function hitungKeperawatanUntukKlinisKlinisIntegrasiTest(kunjungan_id, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `keperawatan` t WHERE ((? OR t.`kunjungan_id` <=> ?))", [kunjungan_id === undefined, kunjungan_id ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function ubahKeperawatanUntukKlinisKlinisIntegrasiTest(nyeri_skala, kunjungan_id, versi, koneksi = pool) {
    const hasil = await tulis("UPDATE `keperawatan` t SET `nyeri_skala` = IF(?, t.`nyeri_skala`, ?) WHERE ((? OR t.`kunjungan_id` <=> ?)) AND ((? OR t.`versi` <=> ?))", [nyeri_skala === undefined, nyeri_skala ?? null, kunjungan_id === undefined, kunjungan_id ?? null, versi === undefined, versi ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export function hapusKeperawatanFasyankesUji(ids, koneksi = pool) {
    return tulis('DELETE FROM `keperawatan` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
