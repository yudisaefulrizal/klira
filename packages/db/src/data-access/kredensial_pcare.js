import { baca, tulis, pool } from '../koneksi.js';
const KOLOM = 't.`id`, t.`environment`, t.`cons_id`, t.`secret_key_terenkripsi`, t.`user_key_terenkripsi`, t.`username`, t.`password_terenkripsi`, t.`app_code`, t.`base_url`, t.`service_name`, t.`aktif`, t.`diuji_pada`, t.`hasil_uji`, t.`dibuat_pada`, t.`diubah_pada`';
export async function daftarKredensialPcare(koneksi = pool) {
    return baca(`SELECT ${KOLOM} FROM \`kredensial_pcare\` t WHERE TRUE ORDER BY t.\`environment\``, [], koneksi);
}
export async function ambilKredensialPcare(environment, koneksi = pool) {
    const baris = await baca(`SELECT ${KOLOM} FROM \`kredensial_pcare\` t WHERE t.\`environment\` = ? LIMIT 1`, [environment], koneksi);
    return baris[0] ?? null;
}
export async function ambilKredensialPcareAktif(koneksi = pool) {
    const baris = await baca(`SELECT ${KOLOM} FROM \`kredensial_pcare\` t WHERE t.\`aktif\` = true LIMIT 1`, [], koneksi);
    return baris[0] ?? null;
}
/** `d`: environment, cons_id, secret_key_terenkripsi, user_key_terenkripsi, username, password_terenkripsi, app_code, base_url, service_name. */
export async function tambahKredensialPcare(d, dibuat_oleh, koneksi = pool) {
    const hasil = await tulis('INSERT INTO `kredensial_pcare` (`environment`, `cons_id`, `secret_key_terenkripsi`, `user_key_terenkripsi`, `username`, `password_terenkripsi`, `app_code`, `base_url`, `service_name`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [d.environment, d.cons_id, d.secret_key_terenkripsi, d.user_key_terenkripsi, d.username, d.password_terenkripsi, d.app_code, d.base_url ?? null, d.service_name, dibuat_oleh ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
/** Rahasia bernilai null berarti tidak diganti. Hasil uji lama dihapus karena kredensial berubah. */
export async function ubahKredensialPcare(id, d, koneksi = pool) {
    const hasil = await tulis('UPDATE `kredensial_pcare` t SET t.`cons_id` = ?, t.`secret_key_terenkripsi` = COALESCE(?, t.`secret_key_terenkripsi`), t.`user_key_terenkripsi` = COALESCE(?, t.`user_key_terenkripsi`), t.`username` = ?, t.`password_terenkripsi` = COALESCE(?, t.`password_terenkripsi`), t.`app_code` = ?, t.`base_url` = ?, t.`service_name` = ?, t.`diuji_pada` = NULL, t.`hasil_uji` = NULL, t.`diubah_pada` = CURRENT_TIMESTAMP(3) WHERE t.`id` = ?', [d.cons_id, d.secret_key_terenkripsi ?? null, d.user_key_terenkripsi ?? null, d.username, d.password_terenkripsi ?? null, d.app_code, d.base_url ?? null, d.service_name, id], koneksi);
    return { count: hasil.affectedRows };
}
export async function aturKredensialPcareAktif(id, koneksi = pool) {
    const hasil = await tulis('UPDATE `kredensial_pcare` t SET t.`aktif` = (t.`id` = ?) WHERE TRUE', [id], koneksi);
    return { count: hasil.affectedRows };
}
export async function catatUjiKredensialPcare(id, hasil_uji, waktu, koneksi = pool) {
    const hasil = await tulis('UPDATE `kredensial_pcare` t SET t.`diuji_pada` = ?, t.`hasil_uji` = ? WHERE t.`id` = ?', [waktu, hasil_uji.slice(0, 500), id], koneksi);
    return { count: hasil.affectedRows };
}
