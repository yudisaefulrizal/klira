import { baca, tulis, pool } from '../koneksi.js';
/** Catat penyerahan hasil lab kunjungan penunjang saja (satu kali per kunjungan; keunikan kunjungan_id menjaga dari ganda). */
export async function tambahPenyerahanHasil(fasyankes_id, kunjungan_id, penerima_nama, hubungan, petugas_id, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `penyerahan_hasil` (`fasyankes_id`, `kunjungan_id`, `penerima_nama`, `hubungan`, `petugas_id`) VALUES (?, ?, ?, ?, ?)", [fasyankes_id, kunjungan_id, penerima_nama, hubungan ?? null, petugas_id], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function cariPenyerahanHasilUntukKunjungan(fasyankes_id, kunjungan_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`penerima_nama`, t.`hubungan`, t.`petugas_id`, t.`waktu` FROM `penyerahan_hasil` t WHERE t.`fasyankes_id` = ? AND t.`kunjungan_id` = ? LIMIT 1", [fasyankes_id, kunjungan_id], koneksi);
    return baris[0] ?? null;
}
/** Ringkasan hasil lab per kunjungan: jumlah order, yang sudah divalidasi, dan waktu penyerahan (null bila belum). */
export async function ringkasanHasilLabUntukKunjungan(fasyankes_id, kunjungan_ids, koneksi = pool) {
    if (!kunjungan_ids.length)
        return [];
    return baca("SELECT k.`id` AS kunjungan_id, COUNT(o.`id`) AS total, COALESCE(SUM(o.`status` = 'divalidasi'), 0) AS divalidasi, p.`waktu` AS diserahkan_pada, p.`penerima_nama` AS penerima_nama FROM `kunjungan` k LEFT JOIN `order_penunjang` o ON o.`kunjungan_id` = k.`id` LEFT JOIN `penyerahan_hasil` p ON p.`kunjungan_id` = k.`id` WHERE k.`fasyankes_id` = ? AND k.`id` IN (?) GROUP BY k.`id`, p.`waktu`, p.`penerima_nama`", [fasyankes_id, kunjungan_ids], koneksi);
}
/** Kunjungan penunjang saja yang hasilnya belum diserahkan, lintas tanggal (terlama dahulu), dengan jumlah order dan yang sudah divalidasi. */
export async function daftarHasilLabBelumDiserahkan(fasyankes_id, koneksi = pool) {
    return baca("SELECT k.`id` AS kunjungan_id, k.`mulai`, k.`perujuk`, ps.`id` AS pasien_id, ps.`nama` AS pasien_nama, ps.`nomor_rm`, COUNT(o.`id`) AS total, COALESCE(SUM(o.`status` = 'divalidasi'), 0) AS divalidasi FROM `kunjungan` k JOIN `pasien` ps ON ps.`id` = k.`pasien_id` LEFT JOIN `order_penunjang` o ON o.`kunjungan_id` = k.`id` WHERE k.`fasyankes_id` = ? AND k.`jenis` = 'LAB' AND NOT EXISTS (SELECT 1 FROM `penyerahan_hasil` p WHERE p.`kunjungan_id` = k.`id`) AND NOT EXISTS (SELECT 1 FROM `antrean` a WHERE a.`kunjungan_id` = k.`id` AND a.`status` = 'batal') GROUP BY k.`id`, k.`mulai`, k.`perujuk`, ps.`id`, ps.`nama`, ps.`nomor_rm` ORDER BY k.`mulai` ASC, k.`id` ASC LIMIT 200", [fasyankes_id], koneksi);
}
/** Jumlah order kunjungan yang belum diambil spesimennya. */
export async function hitungOrderBelumSpesimenUntukKunjungan(fasyankes_id, kunjungan_id, koneksi = pool) {
    const [b] = await baca("SELECT COUNT(*) AS jumlah FROM `order_penunjang` t WHERE t.`fasyankes_id` = ? AND t.`kunjungan_id` = ? AND t.`status` = 'dipesan'", [fasyankes_id, kunjungan_id], koneksi);
    return Number(b.jumlah);
}
/** Jenis kunjungan (AMB, IMP, LAB); null bila tidak ada di fasyankes ini. */
export async function cariJenisKunjunganUntukSerahHasil(fasyankes_id, kunjungan_id, koneksi = pool) {
    const baris = await baca("SELECT t.`jenis` FROM `kunjungan` t WHERE t.`fasyankes_id` = ? AND t.`id` = ? LIMIT 1", [fasyankes_id, kunjungan_id], koneksi);
    return baris[0]?.jenis ?? null;
}
