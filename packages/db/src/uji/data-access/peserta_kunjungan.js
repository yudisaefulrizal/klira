import { baca, tulis, pool } from '../../koneksi.js';
export async function hapusPesertaKunjunganUntukPasienPasienIntegrasiTest(fasyankes_id, koneksi = pool) {
    const hasil = await tulis("DELETE t FROM `peserta_kunjungan` t WHERE ((? OR t.`fasyankes_id` IN (?)))", [fasyankes_id === undefined, (fasyankes_id)?.length ? (fasyankes_id) : [null]], koneksi);
    return { count: hasil.affectedRows };
}
export async function daftarPesertaKunjunganUntukPasienPasienIntegrasiTest(kunjungan_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`pengguna_id`, t.`tipe`, t.`mulai`, t.`selesai`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `peserta_kunjungan` t WHERE ((? OR t.`kunjungan_id` <=> ?))", [kunjungan_id === undefined, kunjungan_id ?? null], koneksi);
    return baris;
}
export function hapusPesertaKunjunganFasyankesUji(ids, koneksi = pool) {
    return tulis('DELETE FROM `peserta_kunjungan` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
