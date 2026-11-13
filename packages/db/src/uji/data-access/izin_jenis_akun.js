import { tulis, pool } from '../../koneksi.js';
export async function tambahBanyakIzinJenisAkunUntukJenisPaket(data, koneksi = pool) {
    if (!data.length)
        return { count: 0 };
    const nilai = data.map(d => [(d.fasyankes_id === undefined ? null : d.fasyankes_id) ?? null, (d.jenis_akun_id === undefined ? null : d.jenis_akun_id) ?? null, (d.izin_id === undefined ? null : d.izin_id) ?? null, (d.dibuat_oleh === undefined ? null : d.dibuat_oleh) ?? null, (d.dibuat_pada === undefined ? new Date() : d.dibuat_pada) ?? null]);
    const hasil = await tulis("INSERT INTO `izin_jenis_akun` (`fasyankes_id`, `jenis_akun_id`, `izin_id`, `dibuat_oleh`, `dibuat_pada`) VALUES ?", [nilai], koneksi);
    return { count: hasil.affectedRows };
}
export async function hapusIzinJenisAkunUntukAksesIzinIntegrasiTest(fasyankes_id, koneksi = pool) {
    const hasil = await tulis("DELETE t FROM `izin_jenis_akun` t WHERE ((? OR t.`fasyankes_id` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function tambahIzinJenisAkunUntukBuatPengguna(fasyankes_id, jenis_akun_id, izin_id, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `izin_jenis_akun` (`fasyankes_id`, `jenis_akun_id`, `izin_id`) VALUES (?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (jenis_akun_id === undefined ? null : jenis_akun_id) ?? null, (izin_id === undefined ? null : izin_id) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function hapusIzinJenisAkunUntukFarmasiFarmasiIntegrasiTest(fasyankes_id, koneksi = pool) {
    const hasil = await tulis("DELETE t FROM `izin_jenis_akun` t WHERE ((? OR t.`fasyankes_id` IN (?)))", [fasyankes_id === undefined, (fasyankes_id)?.length ? (fasyankes_id) : [null]], koneksi);
    return { count: hasil.affectedRows };
}
