import { baca, tulis, pool } from '../koneksi.js';
export async function ambilPemulanganUntukDetail(kunjungan_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`disposisi`, t.`kondisi_pulang`, t.`diagnosis_akhir`, t.`ringkasan`, t.`tindak_lanjut`, t.`waktu`, t.`dibuat_oleh` FROM `pemulangan` t WHERE ((? OR t.`kunjungan_id` <=> ?)) LIMIT 1", [kunjungan_id === undefined, kunjungan_id ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function hitungPemulanganUntukPulangkan(kunjungan_id, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `pemulangan` t WHERE ((? OR t.`kunjungan_id` <=> ?))", [kunjungan_id === undefined, kunjungan_id ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function tambahPemulanganUntukPulangkan(fasyankes_id, kunjungan_id, disposisi, kondisi_pulang, diagnosis_akhir, ringkasan, tindak_lanjut, waktu, dibuat_oleh, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `pemulangan` (`fasyankes_id`, `kunjungan_id`, `disposisi`, `kondisi_pulang`, `diagnosis_akhir`, `ringkasan`, `tindak_lanjut`, `waktu`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (kunjungan_id === undefined ? null : kunjungan_id) ?? null, ((disposisi === undefined ? null : disposisi) ?? null), (kondisi_pulang === undefined ? null : kondisi_pulang) ?? null, (diagnosis_akhir === undefined ? null : diagnosis_akhir) ?? null, (ringkasan === undefined ? null : ringkasan) ?? null, (tindak_lanjut === undefined ? null : tindak_lanjut) ?? null, (waktu === undefined ? new Date() : waktu) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
