import { baca, tulis, pool } from '../../koneksi.js';
export async function tambahResepUntukSiapkan(fasyankes_id, kunjungan_id, dpjp_id, nomor_resep, teks, status, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `resep` (`fasyankes_id`, `kunjungan_id`, `dpjp_id`, `nomor_resep`, `teks`, `status`) VALUES (?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (kunjungan_id === undefined ? null : kunjungan_id) ?? null, (dpjp_id === undefined ? null : dpjp_id) ?? null, (nomor_resep === undefined ? null : nomor_resep) ?? null, (teks === undefined ? null : teks) ?? null, ((status === undefined ? "diajukan" : status) ?? null)], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function tambahResepUntukSiapkanHasil(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`dpjp_id`, t.`nomor_resep`, t.`teks`, t.`jenis_pembiayaan`, t.`status`, t.`waktu_siap`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `resep` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    if (!baris[0])
        throw new Error('Baris resep tidak ditemukan.');
    return baris[0];
}
export async function ambilResepUntukKasirKasirIntegrasiTest(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`dpjp_id`, t.`nomor_resep`, t.`teks`, t.`jenis_pembiayaan`, t.`status`, t.`waktu_siap`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `resep` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    return (baris[0] ?? null);
}
export function hapusResepFasyankesUji(ids, koneksi = pool) {
    return tulis('DELETE FROM `resep` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
