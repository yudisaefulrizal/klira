import { baca, tulis, pool } from '../koneksi.js';

/** Ambil seluruh data kunjungan yang dibutuhkan untuk menyusun payload PCare (pendaftaran, kunjungan, tindakan, obat). */
export async function ambilKunjunganUntukPcare(kunjungan_id, koneksi = pool) {
    const [kunj] = await baca(
        "SELECT k.`id`, k.`jenis`, k.`tahap_layanan`, k.`cara_pembayaran`, k.`keluhan_singkat`, k.`mulai`, k.`selesai`, k.`waktu_tutup`, k.`pcare_no_kunjungan`, k.`pcare_status`, k.`pcare_pesan`, k.`pcare_dikirim_pada`, k.`pcare_rujuk_lanjut`, k.`pcare_item_terkirim`, k.`non_kapitasi`, p.`id` AS `pasien_id`, p.`nama` AS `pasien_nama`, p.`nik` AS `pasien_nik`, p.`jkn_nomor_kartu`, COALESCE(a.`jenis_poli`, l.`kategori_poli`, l.`nama`) AS `jenis_poli`, a.`pcare_no_urut`, pk.`pengguna_id` AS `dokter_id` FROM `kunjungan` k JOIN `pasien` p ON p.`id` = k.`pasien_id` LEFT JOIN `lokasi` l ON l.`id` = k.`lokasi_id` LEFT JOIN `antrean` a ON a.`kunjungan_id` = k.`id` LEFT JOIN `peserta_kunjungan` pk ON pk.`kunjungan_id` = k.`id` AND pk.`tipe` = 'ATND' WHERE k.`id` = ? ORDER BY pk.`id` ASC LIMIT 1",
        [kunjungan_id],
        koneksi,
    );
    if (!kunj)
        return null;
    if (typeof kunj.pcare_rujuk_lanjut === 'string')
        kunj.pcare_rujuk_lanjut = JSON.parse(kunj.pcare_rujuk_lanjut);
    if (typeof kunj.pcare_item_terkirim === 'string')
        kunj.pcare_item_terkirim = JSON.parse(kunj.pcare_item_terkirim);

    const [pemeriksaan] = await baca(
        'SELECT `tensi_sistol`, `tensi_diastol`, `nadi`, `respirasi`, `tinggi`, `berat`, `lingkar_perut`, `kesadaran`, `keluhan_utama`, `subjek` FROM `pemeriksaan` WHERE `kunjungan_id` = ? ORDER BY `versi` DESC, `id` DESC LIMIT 1',
        [kunjungan_id],
        koneksi,
    );
    const diagnosis = await baca(
        "SELECT `kode_icd10`, `nama`, `peran` FROM `diagnosis` WHERE `kunjungan_id` = ? AND `versi` = (SELECT COALESCE(MAX(`versi`), 0) FROM `diagnosis` WHERE `kunjungan_id` = ?) ORDER BY FIELD(`peran`, 'utama', 'penyerta'), `urutan` ASC",
        [kunjungan_id, kunjungan_id],
        koneksi,
    );
    const tindakan = await baca(
        'SELECT `id`, `kode_icd9cm`, `nama`, `tarif_layanan_id`, `jumlah` FROM `tindakan` WHERE `kunjungan_id` = ? AND `versi` = (SELECT COALESCE(MAX(`versi`), 0) FROM `tindakan` WHERE `kunjungan_id` = ?) ORDER BY `id` ASC',
        [kunjungan_id, kunjungan_id],
        koneksi,
    );
    const obat = await baca(
        "SELECT ir.`id`, ir.`master_obat_id`, COALESCE(mo.`nama_tampil`, mo.`kfa_nama`, '') AS `nama_obat`, ir.`aturan_pakai`, ir.`jumlah` FROM `item_resep` ir JOIN `resep` r ON r.`id` = ir.`resep_id` LEFT JOIN `master_obat` mo ON mo.`id` = ir.`master_obat_id` WHERE r.`kunjungan_id` = ? AND r.`status` <> 'dibatalkan' ORDER BY ir.`id` ASC",
        [kunjungan_id],
        koneksi,
    );

    return { ...kunj, pemeriksaan: pemeriksaan ?? null, diagnosis, tindakan, obat };
}

/** Catat `pcare_no_urut` pada baris `antrean` milik kunjungan (jika ada). */
export async function simpanNoUrutPcareKunjungan(kunjungan_id, pcare_no_urut, koneksi = pool) {
    const hasil = await tulis('UPDATE `antrean` SET `pcare_no_urut` = ? WHERE `kunjungan_id` = ?', [pcare_no_urut, kunjungan_id], koneksi);
    return { count: hasil.affectedRows };
}

/** Catat hasil pengiriman kunjungan ke PCare pada baris `kunjungan`. */
export async function catatHasilKirimPcare(kunjungan_id, { pcare_no_kunjungan, pcare_status, pcare_pesan, pcare_dikirim_pada, pcare_item_terkirim }, koneksi = pool) {
    const hasil = await tulis(
        'UPDATE `kunjungan` SET `pcare_no_kunjungan` = COALESCE(?, `pcare_no_kunjungan`), `pcare_status` = ?, `pcare_pesan` = ?, `pcare_dikirim_pada` = ?, `pcare_item_terkirim` = COALESCE(?, `pcare_item_terkirim`) WHERE `id` = ?',
        [pcare_no_kunjungan ?? null, pcare_status, pcare_pesan ? String(pcare_pesan).slice(0, 500) : null, pcare_dikirim_pada ?? new Date(), pcare_item_terkirim ? JSON.stringify(pcare_item_terkirim) : null, kunjungan_id],
        koneksi,
    );
    return { count: hasil.affectedRows };
}

/** Simpan data rujukan lanjut PCare dan/atau penanda non-kapitasi pada kunjungan. */
export async function ubahAtributPcareKunjungan(kunjungan_id, { pcare_rujuk_lanjut, non_kapitasi }, koneksi = pool) {
    const set = [];
    const params = [];
    if (pcare_rujuk_lanjut !== undefined) {
        set.push('`pcare_rujuk_lanjut` = ?');
        params.push(pcare_rujuk_lanjut === null ? null : JSON.stringify(pcare_rujuk_lanjut));
    }
    if (non_kapitasi !== undefined) {
        set.push('`non_kapitasi` = ?');
        params.push(Boolean(non_kapitasi));
    }
    if (!set.length)
        return { count: 0 };
    params.push(kunjungan_id);
    const hasil = await tulis(`UPDATE \`kunjungan\` SET ${set.join(', ')} WHERE \`id\` = ?`, params, koneksi);
    return { count: hasil.affectedRows };
}

/** Simpan atau perbarui satu baris pemetaan kode BPJS (`jenis`, `kunci`, `kode`, `nama`). */
export async function simpanPemetaanBpjsSatuan(jenis, kunci, kode, nama, koneksi = pool) {
    const hasil = await tulis(
        'INSERT INTO `pemetaan_bpjs` (`jenis`, `kunci`, `kode`, `nama`) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE `kode` = VALUES(`kode`), `nama` = VALUES(`nama`)',
        [jenis, kunci, kode, nama ?? null],
        koneksi,
    );
    return { count: hasil.affectedRows };
}

/** Hapus satu baris pemetaan kode BPJS berdasarkan jenis dan kunci. */
export async function hapusPemetaanBpjsSatuan(jenis, kunci, koneksi = pool) {
    const hasil = await tulis('DELETE FROM `pemetaan_bpjs` WHERE `jenis` = ? AND `kunci` = ?', [jenis, kunci], koneksi);
    return { count: hasil.affectedRows };
}
