import { baca, tulis, pool } from '../koneksi.js';
export async function tambahPembukaanRmUntukBuatPembukaan(fasyankes_id, pasien_id, pemohon_nama, pemohon_instansi, dasar, alasan_hukum, dasar_rinci, cakupan, identitas_disamarkan, diminta_oleh, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `pembukaan_rm` (`fasyankes_id`, `pasien_id`, `pemohon_nama`, `pemohon_instansi`, `dasar`, `alasan_hukum`, `dasar_rinci`, `cakupan`, `identitas_disamarkan`, `diminta_oleh`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (pasien_id === undefined ? null : pasien_id) ?? null, (pemohon_nama === undefined ? null : pemohon_nama) ?? null, (pemohon_instansi === undefined ? null : pemohon_instansi) ?? null, ((dasar === undefined ? null : dasar) ?? null), (alasan_hukum === undefined ? null : alasan_hukum) ?? null, (dasar_rinci === undefined ? null : dasar_rinci) ?? null, (cakupan === undefined ? null : cakupan) ?? null, (identitas_disamarkan === undefined ? true : identitas_disamarkan) ?? null, (diminta_oleh === undefined ? null : diminta_oleh) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function tambahPembukaanRmUntukBuatPembukaanHasil(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`pasien_id`, t.`pemohon_nama`, t.`pemohon_instansi`, t.`dasar`, t.`alasan_hukum`, t.`dasar_rinci`, t.`cakupan`, t.`identitas_disamarkan`, t.`status`, t.`penyetuju_id`, t.`catatan_keputusan`, t.`waktu_keputusan`, t.`diminta_oleh`, t.`dibuat_pada` FROM `pembukaan_rm` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    if (!baris[0])
        throw new Error('Baris pembukaan_rm tidak ditemukan.');
    return baris[0];
}
export async function cariPembukaanRmUntukPembukaan(id, fasyankes_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`status`, t.`diminta_oleh` FROM `pembukaan_rm` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) LIMIT 1", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function ubahPembukaanRmUntukPutuskanPembukaan(status, penyetuju_id, catatan_keputusan, waktu_keputusan, id, fasyankes_id, status2, koneksi = pool) {
    const hasil = await tulis("UPDATE `pembukaan_rm` t SET `status` = IF(?, t.`status`, ?), `penyetuju_id` = IF(?, t.`penyetuju_id`, ?), `catatan_keputusan` = IF(?, t.`catatan_keputusan`, ?), `waktu_keputusan` = IF(?, t.`waktu_keputusan`, ?) WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`status` <=> ?))", [status === undefined, (status ?? null), penyetuju_id === undefined, penyetuju_id ?? null, catatan_keputusan === undefined, catatan_keputusan ?? null, waktu_keputusan === undefined, waktu_keputusan ?? null, id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null, status2 === undefined, status2 ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function hitungPembukaanRmUntukDaftarPembukaan(fasyankes_id, status, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `pembukaan_rm` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`status` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null, status === undefined, status ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function daftarPembukaanRmUntukDaftarPembukaan(fasyankes_id, status, batas, lewati, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`pasien_id`, t.`pemohon_nama`, t.`pemohon_instansi`, t.`dasar`, t.`alasan_hukum`, t.`dasar_rinci`, t.`cakupan`, t.`identitas_disamarkan`, t.`status`, t.`penyetuju_id`, t.`catatan_keputusan`, t.`waktu_keputusan`, t.`diminta_oleh`, t.`dibuat_pada` FROM `pembukaan_rm` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`status` <=> ?)) ORDER BY t.`id` DESC LIMIT ? OFFSET ?", [fasyankes_id === undefined, fasyankes_id ?? null, status === undefined, status ?? null, batas ?? 2147483647, lewati ?? 0], koneksi);
    return baris;
}
