import { baca, tulis, pool } from '../../koneksi.js';
export async function tambahKunjunganUntukBuatKunjungan(fasyankes_id, pasien_id, jenis, tahap_layanan, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `kunjungan` (`fasyankes_id`, `pasien_id`, `jenis`, `tahap_layanan`) VALUES (?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (pasien_id === undefined ? null : pasien_id) ?? null, ((jenis === undefined ? null : jenis) ?? null), ((tahap_layanan === undefined ? "menunggu_skrining" : tahap_layanan) ?? null)], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function tambahKunjunganUntukBuatKunjunganHasil(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`pasien_id`, t.`jenis`, t.`status`, t.`tahap_layanan`, t.`kunjungan_asal_id`, t.`lokasi_id`, t.`cara_pembayaran`, t.`nomor_sep`, t.`spri`, t.`keluhan_singkat`, t.`service_type`, t.`encounter_id`, t.`mulai`, t.`selesai`, t.`waktu_tutup`, t.`dibuat_oleh`, t.`dibuat_pada`, t.`diarsipkan_pada`, t.`retensi_sampai` FROM `kunjungan` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    if (!baris[0])
        throw new Error('Baris kunjungan tidak ditemukan.');
    return baris[0];
}
export async function hapusKunjunganUntukFarmasiFarmasiIntegrasiTest(fasyankes_id, koneksi = pool) {
    const hasil = await tulis("DELETE t FROM `kunjungan` t WHERE ((? OR t.`fasyankes_id` IN (?)))", [fasyankes_id === undefined, (fasyankes_id)?.length ? (fasyankes_id) : [null]], koneksi);
    return { count: hasil.affectedRows };
}
export async function ubahKunjunganUntukFarmasiFarmasiIntegrasiTest(tahap_layanan, id, koneksi = pool) {
    const hasil = await tulis("UPDATE `kunjungan` t SET `tahap_layanan` = IF(?, t.`tahap_layanan`, ?) WHERE ((? OR t.`id` <=> ?))", [tahap_layanan === undefined, (tahap_layanan ?? null), id === undefined, id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function ambilKunjunganUntukFarmasiFarmasiIntegrasiTest(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`pasien_id`, t.`jenis`, t.`status`, t.`tahap_layanan`, t.`kunjungan_asal_id`, t.`lokasi_id`, t.`cara_pembayaran`, t.`nomor_sep`, t.`spri`, t.`keluhan_singkat`, t.`service_type`, t.`encounter_id`, t.`mulai`, t.`selesai`, t.`waktu_tutup`, t.`dibuat_oleh`, t.`dibuat_pada`, t.`diarsipkan_pada`, t.`retensi_sampai` FROM `kunjungan` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function tambahKunjunganUntukKunjunganBaru(fasyankes_id, pasien_id, jenis, tahap_layanan, cara_pembayaran, waktu_tutup, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `kunjungan` (`fasyankes_id`, `pasien_id`, `jenis`, `tahap_layanan`, `cara_pembayaran`, `waktu_tutup`) VALUES (?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (pasien_id === undefined ? null : pasien_id) ?? null, ((jenis === undefined ? null : jenis) ?? null), ((tahap_layanan === undefined ? "menunggu_skrining" : tahap_layanan) ?? null), ((cara_pembayaran === undefined ? "umum" : cara_pembayaran) ?? null), (waktu_tutup === undefined ? null : waktu_tutup) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function hitungKunjunganUntukPasienPasienIntegrasiTest(pasien_id, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `kunjungan` t WHERE ((? OR t.`pasien_id` <=> ?))", [pasien_id === undefined, pasien_id ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function hitungKunjunganUntukPasienPasienIntegrasiTest2(fasyankes_id, pasien_id, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `kunjungan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`pasien_id` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null, pasien_id === undefined, pasien_id ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function tambahKunjunganUntukBuatKunjungan3(fasyankes_id, pasien_id, jenis, tahap_layanan, cara_pembayaran, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `kunjungan` (`fasyankes_id`, `pasien_id`, `jenis`, `tahap_layanan`, `cara_pembayaran`) VALUES (?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (pasien_id === undefined ? null : pasien_id) ?? null, ((jenis === undefined ? null : jenis) ?? null), ((tahap_layanan === undefined ? "menunggu_skrining" : tahap_layanan) ?? null), ((cara_pembayaran === undefined ? "umum" : cara_pembayaran) ?? null)], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function ubahKunjunganUntukRawatInapRawatInapIntegrasiTest(kunjungan_asal_id, fasyankes_id, koneksi = pool) {
    const hasil = await tulis("UPDATE `kunjungan` t SET `kunjungan_asal_id` = IF(?, t.`kunjungan_asal_id`, ?) WHERE ((? OR t.`fasyankes_id` IN (?)))", [kunjungan_asal_id === undefined, kunjungan_asal_id ?? null, fasyankes_id === undefined, (fasyankes_id)?.length ? (fasyankes_id) : [null]], koneksi);
    return { count: hasil.affectedRows };
}
export async function tambahKunjunganUntukRawatInapRawatInapIntegrasiTest(fasyankes_id, pasien_id, jenis, status, tahap_layanan, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `kunjungan` (`fasyankes_id`, `pasien_id`, `jenis`, `status`, `tahap_layanan`) VALUES (?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (pasien_id === undefined ? null : pasien_id) ?? null, ((jenis === undefined ? null : jenis) ?? null), ((status === undefined ? "arrived" : status) ?? null), ((tahap_layanan === undefined ? "menunggu_skrining" : tahap_layanan) ?? null)], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function tambahKunjunganUntukKunjunganBaru2(fasyankes_id, pasien_id, jenis, tahap_layanan, waktu_tutup, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `kunjungan` (`fasyankes_id`, `pasien_id`, `jenis`, `tahap_layanan`, `waktu_tutup`) VALUES (?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (pasien_id === undefined ? null : pasien_id) ?? null, ((jenis === undefined ? null : jenis) ?? null), ((tahap_layanan === undefined ? "menunggu_skrining" : tahap_layanan) ?? null), (waktu_tutup === undefined ? null : waktu_tutup) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function ubahKunjunganUntukKunjunganTutup(lokasi_id, id, koneksi = pool) {
    const hasil = await tulis("UPDATE `kunjungan` t SET `lokasi_id` = IF(?, t.`lokasi_id`, ?) WHERE ((? OR t.`id` <=> ?))", [lokasi_id === undefined, lokasi_id ?? null, id === undefined, id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function ubahKunjunganUntukKunjunganSahTutup(tahap_layanan, waktu_tutup, id, koneksi = pool) {
    const hasil = await tulis("UPDATE `kunjungan` t SET `tahap_layanan` = IF(?, t.`tahap_layanan`, ?), `waktu_tutup` = IF(?, t.`waktu_tutup`, ?) WHERE ((? OR t.`id` <=> ?))", [tahap_layanan === undefined, (tahap_layanan ?? null), waktu_tutup === undefined, waktu_tutup ?? null, id === undefined, id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
