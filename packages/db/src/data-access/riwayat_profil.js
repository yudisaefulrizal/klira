import { baca, tulis, pool } from '../koneksi.js';
export async function tambahRiwayatProfilUntukBuatRuteWebsitePengaturan(jenis, ringkasan, dibuat_oleh, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `riwayat_profil` (`jenis`, `ringkasan`, `dibuat_oleh`) VALUES (?, ?, ?)", [(jenis === undefined ? null : jenis) ?? null, (ringkasan === undefined ? null : ringkasan) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function tambahRiwayatProfilUntukTambahRiwayatProfil(jenis, pengguna_id, ringkasan, dibuat_oleh, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `riwayat_profil` (`jenis`, `pengguna_id`, `ringkasan`, `dibuat_oleh`) VALUES (?, ?, ?, ?)", [(jenis === undefined ? null : jenis) ?? null, (pengguna_id === undefined ? null : pengguna_id) ?? null, (ringkasan === undefined ? null : ringkasan) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function tambahBanyakRiwayatProfilUntukSimpan(data, koneksi = pool) {
    if (!data.length)
        return { count: 0 };
    const nilai = data.map(d => [(d.jenis === undefined ? null : d.jenis) ?? null, (d.pengguna_id === undefined ? null : d.pengguna_id) ?? null, (d.ringkasan === undefined ? null : d.ringkasan) ?? null, (d.dibuat_oleh === undefined ? null : d.dibuat_oleh) ?? null, (d.dibuat_pada === undefined ? new Date() : d.dibuat_pada) ?? null]);
    const hasil = await tulis("INSERT INTO `riwayat_profil` (`jenis`, `pengguna_id`, `ringkasan`, `dibuat_oleh`, `dibuat_pada`) VALUES ?", [nilai], koneksi);
    return { count: hasil.affectedRows };
}
export async function hitungRiwayatProfilUntukRiwayat(koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `riwayat_profil` t WHERE TRUE", [], koneksi);
    return Number(baris.jumlah);
}
export async function daftarRiwayatProfilUntukRiwayat(batas, lewati, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`jenis`, t.`pengguna_id`, t.`ringkasan`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `riwayat_profil` t WHERE TRUE ORDER BY t.`dibuat_pada` DESC, t.`id` DESC LIMIT ? OFFSET ?", [batas ?? 2147483647, lewati ?? 0], koneksi);
    return baris;
}
