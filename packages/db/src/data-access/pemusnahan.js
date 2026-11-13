import { baca, tulis, pool } from '../koneksi.js';
export async function hitungPemusnahanUntukRingkasan(fasyankes_id, status, jadwal, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `pemusnahan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR NOT (t.`status` <=> ?))) AND ((? OR t.`jadwal` < ?))", [fasyankes_id === undefined, fasyankes_id ?? null, status === undefined, status ?? null, jadwal === undefined, jadwal ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function hitungPemusnahanUntukDaftarMusnah(fasyankes_id, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `pemusnahan` t WHERE ((? OR t.`fasyankes_id` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function daftarPemusnahanUntukDaftarMusnah(fasyankes_id, batas, lewati, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`cakupan`, t.`dasar`, t.`permintaan_hak_id`, t.`pasien_id`, t.`jadwal`, t.`status`, t.`prosesor_id`, t.`nomor_perintah`, t.`perintah_pada`, t.`pelaksana`, t.`metode`, t.`mencakup_cadangan`, t.`pelaksanaan_pada`, t.`berita_acara`, t.`berita_acara_pada`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `pemusnahan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) ORDER BY t.`id` DESC LIMIT ? OFFSET ?", [fasyankes_id === undefined, fasyankes_id ?? null, batas ?? 2147483647, lewati ?? 0], koneksi);
    return baris;
}
export async function cariPemusnahanUntukMusnah(id, fasyankes_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`cakupan`, t.`dasar`, t.`permintaan_hak_id`, t.`pasien_id`, t.`jadwal`, t.`status`, t.`prosesor_id`, t.`nomor_perintah`, t.`perintah_pada`, t.`pelaksana`, t.`metode`, t.`mencakup_cadangan`, t.`pelaksanaan_pada`, t.`berita_acara`, t.`berita_acara_pada`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `pemusnahan` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) LIMIT 1", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function tambahPemusnahanUntukBuatMusnah(fasyankes_id, cakupan, dasar, permintaan_hak_id, pasien_id, jadwal, dibuat_oleh, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `pemusnahan` (`fasyankes_id`, `cakupan`, `dasar`, `permintaan_hak_id`, `pasien_id`, `jadwal`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (cakupan === undefined ? null : cakupan) ?? null, (dasar === undefined ? null : dasar) ?? null, (permintaan_hak_id === undefined ? null : permintaan_hak_id) ?? null, (pasien_id === undefined ? null : pasien_id) ?? null, (jadwal === undefined ? null : jadwal) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function tambahPemusnahanUntukBuatMusnahHasil(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`cakupan`, t.`dasar`, t.`permintaan_hak_id`, t.`pasien_id`, t.`jadwal`, t.`status`, t.`prosesor_id`, t.`nomor_perintah`, t.`perintah_pada`, t.`pelaksana`, t.`metode`, t.`mencakup_cadangan`, t.`pelaksanaan_pada`, t.`berita_acara`, t.`berita_acara_pada`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `pemusnahan` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    if (!baris[0])
        throw new Error('Baris pemusnahan tidak ditemukan.');
    return baris[0];
}
export async function ubahPemusnahanUntukMajuMusnah(fasyankes_id, cakupan, dasar, permintaan_hak_id, pasien_id, jadwal, status, prosesor_id, nomor_perintah, perintah_pada, pelaksana, metode, mencakup_cadangan, pelaksanaan_pada, berita_acara, berita_acara_pada, dibuat_oleh, dibuat_pada, id, fasyankes_id2, status2, koneksi = pool) {
    const hasil = await tulis("UPDATE `pemusnahan` t SET `fasyankes_id` = IF(?, t.`fasyankes_id`, ?), `cakupan` = IF(?, t.`cakupan`, ?), `dasar` = IF(?, t.`dasar`, ?), `permintaan_hak_id` = IF(?, t.`permintaan_hak_id`, ?), `pasien_id` = IF(?, t.`pasien_id`, ?), `jadwal` = IF(?, t.`jadwal`, ?), `status` = IF(?, t.`status`, ?), `prosesor_id` = IF(?, t.`prosesor_id`, ?), `nomor_perintah` = IF(?, t.`nomor_perintah`, ?), `perintah_pada` = IF(?, t.`perintah_pada`, ?), `pelaksana` = IF(?, t.`pelaksana`, ?), `metode` = IF(?, t.`metode`, ?), `mencakup_cadangan` = IF(?, t.`mencakup_cadangan`, ?), `pelaksanaan_pada` = IF(?, t.`pelaksanaan_pada`, ?), `berita_acara` = IF(?, t.`berita_acara`, ?), `berita_acara_pada` = IF(?, t.`berita_acara_pada`, ?), `dibuat_oleh` = IF(?, t.`dibuat_oleh`, ?), `dibuat_pada` = IF(?, t.`dibuat_pada`, ?) WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`status` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null, cakupan === undefined, cakupan ?? null, dasar === undefined, dasar ?? null, permintaan_hak_id === undefined, permintaan_hak_id ?? null, pasien_id === undefined, pasien_id ?? null, jadwal === undefined, jadwal ?? null, status === undefined, (status ?? null), prosesor_id === undefined, prosesor_id ?? null, nomor_perintah === undefined, nomor_perintah ?? null, perintah_pada === undefined, perintah_pada ?? null, pelaksana === undefined, pelaksana ?? null, metode === undefined, metode ?? null, mencakup_cadangan === undefined, mencakup_cadangan ?? null, pelaksanaan_pada === undefined, pelaksanaan_pada ?? null, berita_acara === undefined, berita_acara ?? null, berita_acara_pada === undefined, berita_acara_pada ?? null, dibuat_oleh === undefined, dibuat_oleh ?? null, dibuat_pada === undefined, dibuat_pada ?? null, id === undefined, id ?? null, fasyankes_id2 === undefined, fasyankes_id2 ?? null, status2 === undefined, status2 ?? null], koneksi);
    return { count: hasil.affectedRows };
}
