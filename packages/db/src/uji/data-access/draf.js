import { baca, tulis, pool } from '../../koneksi.js';
export async function hitungDrafUntukKlinisKlinisIntegrasiTest(pengguna_id, kunjungan_id, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `draf` t WHERE ((? OR t.`pengguna_id` <=> ?)) AND ((? OR t.`kunjungan_id` <=> ?))", [pengguna_id === undefined, pengguna_id ?? null, kunjungan_id === undefined, kunjungan_id ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function wajibDrafUntukKlinisKlinisIntegrasiTest(pengguna_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`pengguna_id`, t.`alur`, t.`kunjungan_id`, t.`pasien_id`, t.`langkah_terakhir`, t.`isi`, t.`diperbarui_pada`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `draf` t WHERE ((? OR t.`pengguna_id` <=> ?)) LIMIT 1", [pengguna_id === undefined, pengguna_id ?? null], koneksi);
    for (const b of baris)
        if (typeof b.isi === 'string')
            b.isi = JSON.parse(b.isi);
    if (!baris[0])
        throw new Error('Baris draf tidak ditemukan.');
    return baris[0];
}
export async function ubahDrafUntukKlinisKlinisIntegrasiTest(diperbarui_pada, pengguna_id, koneksi = pool) {
    const hasil = await tulis("UPDATE `draf` t SET `diperbarui_pada` = IF(?, t.`diperbarui_pada`, ?) WHERE ((? OR t.`pengguna_id` <=> ?))", [diperbarui_pada === undefined, diperbarui_pada ?? null, pengguna_id === undefined, pengguna_id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function hitungDrafUntukKlinisKlinisIntegrasiTest2(pengguna_id, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `draf` t WHERE ((? OR t.`pengguna_id` <=> ?))", [pengguna_id === undefined, pengguna_id ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function hitungDrafUntukKlinisKlinisIntegrasiTest3(kunjungan_id, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `draf` t WHERE ((? OR t.`kunjungan_id` <=> ?))", [kunjungan_id === undefined, kunjungan_id ?? null], koneksi);
    return Number(baris.jumlah);
}
export function hapusDrafFasyankesUji(ids, koneksi = pool) {
    return tulis('DELETE FROM `draf` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
