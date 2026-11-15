import { baca, tulis, pool } from '../koneksi.js';
const KOLOM = 't.`id`, t.`fasyankes_id`, t.`environment`, t.`client_id`, t.`client_secret_terenkripsi`, t.`base_url`, t.`aktif`, t.`diuji_pada`, t.`hasil_uji`, t.`dibuat_pada`, t.`diubah_pada`';
/** Semua kredensial SATUSEHAT sebuah fasyankes (satu per lingkungan). */
export async function daftarKredensialSatusehat(fasyankes_id, koneksi = pool) {
    return baca(`SELECT ${KOLOM} FROM \`kredensial_satusehat\` t WHERE t.\`fasyankes_id\` = ? ORDER BY t.\`environment\``, [fasyankes_id], koneksi);
}
export async function ambilKredensialSatusehat(fasyankes_id, environment, koneksi = pool) {
    const baris = await baca(`SELECT ${KOLOM} FROM \`kredensial_satusehat\` t WHERE t.\`fasyankes_id\` = ? AND t.\`environment\` = ? LIMIT 1`, [fasyankes_id, environment], koneksi);
    return baris[0] ?? null;
}
export async function ambilKredensialSatusehatAktif(fasyankes_id, koneksi = pool) {
    const baris = await baca(`SELECT ${KOLOM} FROM \`kredensial_satusehat\` t WHERE t.\`fasyankes_id\` = ? AND t.\`aktif\` = true LIMIT 1`, [fasyankes_id], koneksi);
    return baris[0] ?? null;
}
export async function tambahKredensialSatusehat(fasyankes_id, environment, client_id, client_secret_terenkripsi, base_url, dibuat_oleh, koneksi = pool) {
    const hasil = await tulis('INSERT INTO `kredensial_satusehat` (`fasyankes_id`, `environment`, `client_id`, `client_secret_terenkripsi`, `base_url`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?)', [fasyankes_id, environment, client_id, client_secret_terenkripsi, base_url ?? null, dibuat_oleh ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
/** Ubah isian; `client_secret_terenkripsi` null berarti rahasia tidak diganti. Hasil uji lama dihapus karena kredensial berubah. */
export async function ubahKredensialSatusehat(id, client_id, client_secret_terenkripsi, base_url, koneksi = pool) {
    const hasil = await tulis('UPDATE `kredensial_satusehat` t SET t.`client_id` = ?, t.`client_secret_terenkripsi` = COALESCE(?, t.`client_secret_terenkripsi`), t.`base_url` = ?, t.`diuji_pada` = NULL, t.`hasil_uji` = NULL, t.`diubah_pada` = CURRENT_TIMESTAMP(3) WHERE t.`id` = ?', [client_id, client_secret_terenkripsi ?? null, base_url ?? null, id], koneksi);
    return { count: hasil.affectedRows };
}
/** Tepat satu lingkungan aktif per fasyankes: baris `id` menjadi aktif, lainnya nonaktif. */
export async function aturKredensialSatusehatAktif(fasyankes_id, id, koneksi = pool) {
    const hasil = await tulis('UPDATE `kredensial_satusehat` t SET t.`aktif` = (t.`id` = ?) WHERE t.`fasyankes_id` = ?', [id, fasyankes_id], koneksi);
    return { count: hasil.affectedRows };
}
export async function catatUjiKredensialSatusehat(id, hasil_uji, waktu, koneksi = pool) {
    const hasil = await tulis('UPDATE `kredensial_satusehat` t SET t.`diuji_pada` = ?, t.`hasil_uji` = ? WHERE t.`id` = ?', [waktu, hasil_uji.slice(0, 500), id], koneksi);
    return { count: hasil.affectedRows };
}
