import { tulis, pool } from '../../koneksi.js';
export async function hapusIzinPerAkunUntukAksesIzinIntegrasiTest(fasyankes_id, koneksi = pool) {
    const hasil = await tulis("DELETE t FROM `izin_per_akun` t WHERE ((? OR t.`fasyankes_id` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function tambahIzinPerAkunUntukPenggunaPenggunaIntegrasiTest(fasyankes_id, pengguna_id, izin_id, tipe, alasan, mulai, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `izin_per_akun` (`fasyankes_id`, `pengguna_id`, `izin_id`, `tipe`, `alasan`, `mulai`) VALUES (?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (pengguna_id === undefined ? null : pengguna_id) ?? null, (izin_id === undefined ? null : izin_id) ?? null, ((tipe === undefined ? null : tipe) ?? null), (alasan === undefined ? null : alasan) ?? null, (mulai === undefined ? null : mulai) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export function hapusIzinPerAkunFasyankesUji(ids, koneksi = pool) {
    return tulis('DELETE FROM `izin_per_akun` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
