import { baca, tulis, pool } from '../../koneksi.js';
export async function hapusPersetujuanUntukPasienPasienIntegrasiTest(fasyankes_id, koneksi = pool) {
    const hasil = await tulis("DELETE t FROM `persetujuan` t WHERE ((? OR t.`fasyankes_id` IN (?)))", [fasyankes_id === undefined, (fasyankes_id)?.length ? (fasyankes_id) : [null]], koneksi);
    return { count: hasil.affectedRows };
}
export async function hitungPersetujuanUntukHitung(fasyankes_id, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `persetujuan` t WHERE ((? OR t.`fasyankes_id` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function tambahPersetujuanUntukBuat(fasyankes_id, pasien_id, jenis, versi_teks, tujuan, bentuk, penandatangan, penandatangan_nama, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `persetujuan` (`fasyankes_id`, `pasien_id`, `jenis`, `versi_teks`, `tujuan`, `bentuk`, `penandatangan`, `penandatangan_nama`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (pasien_id === undefined ? null : pasien_id) ?? null, ((jenis === undefined ? null : jenis) ?? null), (versi_teks === undefined ? null : versi_teks) ?? null, (tujuan === undefined ? null : tujuan) ?? null, (bentuk === undefined ? null : bentuk) ?? null, (penandatangan === undefined ? null : penandatangan) ?? null, (penandatangan_nama === undefined ? null : penandatangan_nama) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function tambahPersetujuanUntukBuatHasil(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`pasien_id`, t.`jenis`, t.`teks_persetujuan_id`, t.`versi_teks`, t.`tujuan`, t.`penjelasan`, t.`bentuk`, t.`status`, t.`waktu`, t.`penandatangan`, t.`wali_id`, t.`penandatangan_nama`, t.`saksi_pengguna_id`, t.`kunjungan_id`, t.`tindakan_kode`, t.`tindakan_nama`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `persetujuan` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    if (!baris[0])
        throw new Error('Baris persetujuan tidak ditemukan.');
    return baris[0];
}
export function hapusPersetujuanFasyankesUji(ids, koneksi = pool) {
    return tulis('DELETE FROM `persetujuan` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
