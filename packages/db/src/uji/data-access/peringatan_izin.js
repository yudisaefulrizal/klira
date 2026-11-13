import { baca, tulis, pool } from '../../koneksi.js';
export async function hapusPeringatanIzinUntukAksesIzinIntegrasiTest(fasyankes_id, koneksi = pool) {
    const hasil = await tulis("DELETE t FROM `peringatan_izin` t WHERE ((? OR t.`fasyankes_id` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function tambahPeringatanIzinUntukBuat(fasyankes_id, pengguna_id, jenis_peringatan, alasan_pimpinan, sumber, diterima_untuk_akun, ditetapkan_oleh, waktu, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `peringatan_izin` (`fasyankes_id`, `pengguna_id`, `jenis_peringatan`, `alasan_pimpinan`, `sumber`, `diterima_untuk_akun`, `ditetapkan_oleh`, `waktu`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (pengguna_id === undefined ? null : pengguna_id) ?? null, (jenis_peringatan === undefined ? null : jenis_peringatan) ?? null, (alasan_pimpinan === undefined ? null : alasan_pimpinan) ?? null, (sumber === undefined ? "pemberian" : sumber) ?? null, (diterima_untuk_akun === undefined ? false : diterima_untuk_akun) ?? null, (ditetapkan_oleh === undefined ? null : ditetapkan_oleh) ?? null, (waktu === undefined ? new Date() : waktu) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function tambahPeringatanIzinUntukBuatHasil(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`pengguna_id`, t.`izin_id`, t.`penugasan_id`, t.`jenis_peringatan`, t.`alasan_pimpinan`, t.`sumber`, t.`diterima_untuk_akun`, t.`keterangan`, t.`ditetapkan_oleh`, t.`waktu`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `peringatan_izin` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    if (!baris[0])
        throw new Error('Baris peringatan_izin tidak ditemukan.');
    return baris[0];
}
export async function hapusPeringatanIzinUntukKlinisKlinisIntegrasiTest(fasyankes_id, koneksi = pool) {
    const hasil = await tulis("DELETE t FROM `peringatan_izin` t WHERE ((? OR t.`fasyankes_id` IN (?)))", [fasyankes_id === undefined, (fasyankes_id)?.length ? (fasyankes_id) : [null]], koneksi);
    return { count: hasil.affectedRows };
}
export async function daftarPeringatanIzinUntukPenggunaPembuatanIntegrasiTest(pengguna_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`pengguna_id`, t.`izin_id`, t.`penugasan_id`, t.`jenis_peringatan`, t.`alasan_pimpinan`, t.`sumber`, t.`diterima_untuk_akun`, t.`keterangan`, t.`ditetapkan_oleh`, t.`waktu`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `peringatan_izin` t WHERE ((? OR t.`pengguna_id` <=> ?))", [pengguna_id === undefined, pengguna_id ?? null], koneksi);
    return baris;
}
export async function tambahPeringatanIzinUntukPenggunaPenggunaIntegrasiTest(fasyankes_id, pengguna_id, jenis_peringatan, alasan_pimpinan, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `peringatan_izin` (`fasyankes_id`, `pengguna_id`, `jenis_peringatan`, `alasan_pimpinan`) VALUES (?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (pengguna_id === undefined ? null : pengguna_id) ?? null, (jenis_peringatan === undefined ? null : jenis_peringatan) ?? null, (alasan_pimpinan === undefined ? null : alasan_pimpinan) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export function hapusPeringatanIzinFasyankesUji(ids, koneksi = pool) {
    return tulis('DELETE FROM `peringatan_izin` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
