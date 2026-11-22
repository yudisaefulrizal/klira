import { baca, tulis, pool } from '../koneksi.js';
const KOLOM = 't.`id`, t.`fasyankes_id`, t.`aktif`, t.`service_name`, t.`user_key_terenkripsi`';
export async function ambilPengaturanAntreanJkn(fasyankes_id, koneksi = pool) {
    const baris = await baca(`SELECT ${KOLOM} FROM \`pengaturan_antrean_jkn\` t WHERE t.\`fasyankes_id\` = ? LIMIT 1`, [fasyankes_id], koneksi);
    return baris[0] ?? null;
}
/** Fasyankes yang mengaktifkan antrean online (untuk penarikan berkala). */
export async function daftarFasyankesAntreanJknAktif(koneksi = pool) {
    return (await baca('SELECT t.`fasyankes_id` FROM `pengaturan_antrean_jkn` t WHERE t.`aktif` = true ORDER BY t.`fasyankes_id`', [], koneksi)).map((b) => b.fasyankes_id);
}
/** Simpan (buat atau ubah). `user_key_terenkripsi` bernilai null berarti tidak diganti. */
export async function simpanPengaturanAntreanJkn(fasyankes_id, d, dibuat_oleh, koneksi = pool) {
    const hasil = await tulis('INSERT INTO `pengaturan_antrean_jkn` (`fasyankes_id`, `aktif`, `service_name`, `user_key_terenkripsi`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE `aktif` = VALUES(`aktif`), `service_name` = VALUES(`service_name`), `user_key_terenkripsi` = COALESCE(VALUES(`user_key_terenkripsi`), `user_key_terenkripsi`), `diubah_pada` = CURRENT_TIMESTAMP(3)', [fasyankes_id, Boolean(d.aktif), d.service_name, d.user_key_terenkripsi ?? null, dibuat_oleh ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function daftarPemetaanBpjs(fasyankes_id, koneksi = pool) {
    return baca('SELECT t.`jenis`, t.`kunci`, t.`kode`, t.`nama` FROM `pemetaan_bpjs` t WHERE t.`fasyankes_id` = ? ORDER BY t.`jenis`, t.`kunci`', [fasyankes_id], koneksi);
}
export async function hapusPemetaanBpjs(fasyankes_id, koneksi = pool) {
    const hasil = await tulis('DELETE FROM `pemetaan_bpjs` WHERE `fasyankes_id` = ?', [fasyankes_id], koneksi);
    return { count: hasil.affectedRows };
}
export async function tambahPemetaanBpjs(fasyankes_id, jenis, kunci, kode, nama, koneksi = pool) {
    const hasil = await tulis('INSERT INTO `pemetaan_bpjs` (`fasyankes_id`, `jenis`, `kunci`, `kode`, `nama`) VALUES (?, ?, ?, ?, ?)', [fasyankes_id, jenis, kunci, kode, nama ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
/** Pasien menurut nomor kartu JKN atau NIK (yang cocok nomor kartu didahulukan). */
export async function cariPasienUntukAntreanJkn(fasyankes_id, jkn_nomor_kartu, nik, koneksi = pool) {
    const baris = await baca('SELECT t.`id`, t.`nomor_rm`, t.`nama`, t.`nik`, t.`jkn_nomor_kartu`, t.`nomor_hp` FROM `pasien` t WHERE t.`fasyankes_id` = ? AND (t.`jkn_nomor_kartu` = ? OR t.`nik` = ?) ORDER BY (t.`jkn_nomor_kartu` <=> ?) DESC, t.`id` ASC LIMIT 1', [fasyankes_id, jkn_nomor_kartu ?? '', nik ?? '', jkn_nomor_kartu ?? ''], koneksi);
    return baris[0] ?? null;
}
export async function isiNomorKartuJknPasien(id, fasyankes_id, jkn_nomor_kartu, koneksi = pool) {
    const hasil = await tulis('UPDATE `pasien` t SET t.`jkn_nomor_kartu` = ? WHERE t.`id` = ? AND t.`fasyankes_id` = ? AND (t.`jkn_nomor_kartu` IS NULL OR t.`jkn_nomor_kartu` = \'\')', [jkn_nomor_kartu, id, fasyankes_id], koneksi);
    return { count: hasil.affectedRows };
}
/** Antrean terbaru seorang pasien pada jenis poli dan hari itu, apa pun statusnya. */
export async function cariAntreanPasienUntukJkn(fasyankes_id, pasien_id, jenis_poli, tanggal, koneksi = pool) {
    const baris = await baca('SELECT a.`id`, a.`nomor`, a.`awalan`, a.`status`, a.`sumber`, a.`kunjungan_id`, a.`pcare_no_urut` FROM `antrean` a JOIN `kunjungan` k ON k.`id` = a.`kunjungan_id` WHERE a.`fasyankes_id` = ? AND k.`pasien_id` = ? AND a.`jenis_poli` = ? AND a.`tanggal` = ? ORDER BY a.`id` DESC LIMIT 1', [fasyankes_id, pasien_id, jenis_poli, tanggal], koneksi);
    return baris[0] ?? null;
}
/** Data satu antrean untuk dikirim ke BPJS: antrean, kunjungan, pasien, dan dokter penanggung jawab (bila ada). */
export async function ambilAntreanUntukBpjs(fasyankes_id, id, koneksi = pool) {
    const baris = await baca("SELECT a.`id`, a.`nomor`, a.`awalan`, a.`jenis_poli`, a.`tanggal`, a.`status`, a.`sumber`, a.`bpjs_status`, k.`id` AS `kunjungan_id`, k.`jenis`, k.`cara_pembayaran`, k.`keluhan_singkat`, p.`nomor_rm`, p.`nik`, p.`nomor_hp`, p.`jkn_nomor_kartu`, u.`id` AS `dokter_id`, u.`nama` AS `dokter_nama` FROM `antrean` a JOIN `kunjungan` k ON k.`id` = a.`kunjungan_id` JOIN `pasien` p ON p.`id` = k.`pasien_id` LEFT JOIN `peserta_kunjungan` pk ON pk.`kunjungan_id` = k.`id` AND pk.`tipe` = 'ATND' LEFT JOIN `pengguna` u ON u.`id` = pk.`pengguna_id` WHERE a.`id` = ? AND a.`fasyankes_id` = ? ORDER BY pk.`id` ASC LIMIT 1", [id, fasyankes_id], koneksi);
    return baris[0] ?? null;
}
export async function ambilAntreanIdUntukKunjungan(fasyankes_id, kunjungan_id, koneksi = pool) {
    const baris = await baca('SELECT t.`id` FROM `antrean` t WHERE t.`kunjungan_id` = ? AND t.`fasyankes_id` = ? LIMIT 1', [kunjungan_id, fasyankes_id], koneksi);
    return baris[0]?.id ?? null;
}
export async function catatSinkronAntreanBpjs(id, fasyankes_id, bpjs_status, bpjs_pesan, koneksi = pool) {
    const hasil = await tulis('UPDATE `antrean` t SET t.`bpjs_status` = ?, t.`bpjs_pesan` = ? WHERE t.`id` = ? AND t.`fasyankes_id` = ?', [bpjs_status, bpjs_pesan ? String(bpjs_pesan).slice(0, 300) : null, id, fasyankes_id], koneksi);
    return { count: hasil.affectedRows };
}
/** Tandai asal antrean; `pcare_no_urut` (opsional) adalah nomor urut pendaftaran PCare yang menjadi asalnya. */
export async function tandaiSumberAntrean(kunjungan_id, fasyankes_id, sumber, pcare_no_urut, koneksi = pool) {
    const hasil = await tulis('UPDATE `antrean` t SET t.`sumber` = ?, t.`pcare_no_urut` = ? WHERE t.`kunjungan_id` = ? AND t.`fasyankes_id` = ?', [sumber, pcare_no_urut ?? null, kunjungan_id, fasyankes_id], koneksi);
    return { count: hasil.affectedRows };
}
/** Asal antrean dan hasil kirim ke BPJS untuk sekumpulan kunjungan (penanda di daftar pasien). */
export async function daftarSumberAntreanUntukKunjungan(fasyankes_id, kunjungan_ids, koneksi = pool) {
    if (!kunjungan_ids.length)
        return [];
    return baca('SELECT t.`kunjungan_id`, t.`sumber`, t.`pcare_no_urut`, t.`bpjs_status`, t.`bpjs_pesan` FROM `antrean` t WHERE t.`fasyankes_id` = ? AND t.`kunjungan_id` IN (?)', [fasyankes_id, kunjungan_ids], koneksi);
}
/** Antrean hari itu yang berasal dari pendaftaran PCare (sudah ditarik), apa pun statusnya, beserta nomor kartu pesertanya. */
export async function daftarAntreanPcareUntukTanggal(fasyankes_id, tanggal, koneksi = pool) {
    return baca('SELECT t.`id`, t.`jenis_poli`, t.`pcare_no_urut`, t.`status`, t.`sumber`, p.`jkn_nomor_kartu` FROM `antrean` t JOIN `kunjungan` k ON k.`id` = t.`kunjungan_id` JOIN `pasien` p ON p.`id` = k.`pasien_id` WHERE t.`fasyankes_id` = ? AND t.`tanggal` = ? AND t.`pcare_no_urut` IS NOT NULL', [fasyankes_id, tanggal], koneksi);
}
/** Kaitkan antrean yang sudah ada (daftar di loket) dengan pendaftaran PCare peserta yang sama. */
export async function isiNomorUrutPcareAntrean(id, fasyankes_id, pcare_no_urut, koneksi = pool) {
    const hasil = await tulis('UPDATE `antrean` t SET t.`pcare_no_urut` = ? WHERE t.`id` = ? AND t.`fasyankes_id` = ?', [pcare_no_urut, id, fasyankes_id], koneksi);
    return { count: hasil.affectedRows };
}
/** Pemetaan kode poli BPJS berkunci nama poli: ikut diganti saat poli diganti nama. */
export async function ubahKunciPemetaanPoli(fasyankes_id, lama, baru, koneksi = pool) {
    const hasil = await tulis("UPDATE `pemetaan_bpjs` SET `kunci` = ? WHERE `fasyankes_id` = ? AND `jenis` = 'poli' AND LOWER(`kunci`) = LOWER(?)", [baru, fasyankes_id, lama], koneksi);
    return { count: hasil.affectedRows };
}
