import { baca, tulis, pool } from '../koneksi.js';
export async function tambahUrutanNomorRmUntukDaftarkan(terakhir, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `urutan_nomor_rm` (`terakhir`) VALUES (?)", [(terakhir === undefined ? 0 : terakhir) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function ubahUrutanNomorRmUntukDaftarkan(terakhir, koneksi = pool) {
    const hasil = await tulis("UPDATE `urutan_nomor_rm` t SET `terakhir` = IF(?, t.`terakhir`, t.`terakhir` + ?) WHERE TRUE", [terakhir === undefined, terakhir ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function ubahUrutanNomorRmUntukDaftarkanHasil(koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`terakhir`, t.`dibuat_pada` FROM `urutan_nomor_rm` t WHERE TRUE LIMIT 1", [], koneksi);
    if (!baris[0])
        throw new Error('Baris urutan_nomor_rm tidak ditemukan.');
    return baris[0];
}
