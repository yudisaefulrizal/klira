import { baca, tulis, pool } from '../koneksi.js';
export async function tambahRiwayatJenisAkunUntukBuatJenisAkun(jenis_akun_id, ringkasan, alasan, dibuat_oleh, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `riwayat_jenis_akun` (`jenis_akun_id`, `ringkasan`, `alasan`, `dibuat_oleh`) VALUES (?, ?, ?, ?)", [(jenis_akun_id === undefined ? null : jenis_akun_id) ?? null, (ringkasan === undefined ? null : ringkasan) ?? null, (alasan === undefined ? null : alasan) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function daftarRiwayatJenisAkunUntukRiwayatJenisAkun(jenis_akun_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`jenis_akun_id`, t.`ringkasan`, t.`alasan`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `riwayat_jenis_akun` t WHERE ((? OR t.`jenis_akun_id` <=> ?)) ORDER BY t.`id` DESC", [jenis_akun_id === undefined, jenis_akun_id ?? null], koneksi);
    return baris;
}
