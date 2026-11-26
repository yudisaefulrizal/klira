import { baca, tulis, pool } from '../koneksi.js';

/** Sesi antrean aktif (`status = 'buka'`) untuk satu fasyankes, atau null bila sedang ditutup. */
export async function ambilSesiAntreanAktif(koneksi = pool) {
    const baris = await baca(
        "SELECT `id`, `status`, `dibuka_oleh`, `dibuka_pada`, `ditutup_oleh`, `ditutup_pada` FROM `sesi_antrean` WHERE `status` = 'buka' ORDER BY `id` DESC LIMIT 1",
        [],
        koneksi,
    );
    return baris[0] ?? null;
}

/** Sesi antrean terakhir (buka maupun tutup) untuk mengetahui status saat ini. */
export async function ambilSesiAntreanTerakhir(koneksi = pool) {
    const baris = await baca(
        'SELECT `id`, `status`, `dibuka_oleh`, `dibuka_pada`, `ditutup_oleh`, `ditutup_pada` FROM `sesi_antrean` WHERE TRUE ORDER BY `id` DESC LIMIT 1',
        [],
        koneksi,
    );
    return baris[0] ?? null;
}

export async function buatSesiAntrean(dibuka_oleh, waktu = new Date(), koneksi = pool) {
    const hasil = await tulis(
        "INSERT INTO `sesi_antrean` (`status`, `dibuka_oleh`, `dibuka_pada`) VALUES ('buka', ?, ?)",
        [dibuka_oleh ?? null, waktu],
        koneksi,
    );
    return { id: hasil.insertId, status: 'buka', dibuka_oleh: dibuka_oleh ?? null, dibuka_pada: waktu, ditutup_oleh: null, ditutup_pada: null };
}

export async function tutupSesiAntrean(id, ditutup_oleh, waktu = new Date(), koneksi = pool) {
    const hasil = await tulis(
        "UPDATE `sesi_antrean` SET `status` = 'tutup', `ditutup_oleh` = ?, `ditutup_pada` = ? WHERE `id` = ? AND `status` = 'buka'",
        [ditutup_oleh ?? null, waktu, id],
        koneksi,
    );
    return { count: hasil.affectedRows };
}

/** Daftar antrean pada sesi ini yang kunjungannya belum ditutup dan antreannya tidak dibatalkan. */
export async function daftarAntreanBelumSelesaiDalamSesi(sesi_id, koneksi = pool) {
    return baca(
        "SELECT a.`id`, a.`kunjungan_id`, a.`nomor`, a.`awalan`, a.`jenis_poli`, a.`status`, k.`id_layanan`, k.`tahap_layanan`, p.`nama` AS `pasien_nama` FROM `antrean` a JOIN `kunjungan` k ON k.`id` = a.`kunjungan_id` JOIN `pasien` p ON p.`id` = k.`pasien_id` WHERE a.`sesi_id` = ? AND k.`tahap_layanan` <> 'ditutup' AND a.`status` <> 'batal' ORDER BY a.`id` ASC",
        [sesi_id],
        koneksi,
    );
}

export async function daftarAntreanSementaraJkn(status = 'menunggu', koneksi = pool) {
    return baca(
        'SELECT t.`id`, t.`pasien_id`, t.`lokasi_id`, t.`jenis_poli`, t.`awalan`, t.`pcare_no_urut`, t.`jkn_nomor_kartu`, t.`keluhan_singkat`, t.`tanggal_daftar`, t.`status`, t.`kunjungan_id`, t.`dibuat_pada`, p.`nama` AS `pasien_nama`, p.`nomor_rm` AS `pasien_nomor_rm` FROM `antrean_sementara_jkn` t JOIN `pasien` p ON p.`id` = t.`pasien_id` WHERE t.`status` = ? ORDER BY t.`id` ASC',
        [status],
        koneksi,
    );
}

export async function cariAntreanSementaraJkn(jenis_poli, pcare_no_urut, jkn_nomor_kartu, koneksi = pool) {
    const baris = await baca(
        "SELECT t.`id`, t.`status` FROM `antrean_sementara_jkn` t WHERE LOWER(t.`jenis_poli`) = LOWER(?) AND t.`pcare_no_urut` = ? AND (t.`jkn_nomor_kartu` <=> ?) AND t.`status` = 'menunggu' LIMIT 1",
        [jenis_poli, pcare_no_urut, jkn_nomor_kartu ?? null],
        koneksi,
    );
    return baris[0] ?? null;
}

export async function tambahAntreanSementaraJkn(d, koneksi = pool) {
    const hasil = await tulis(
        "INSERT INTO `antrean_sementara_jkn` (`pasien_id`, `lokasi_id`, `jenis_poli`, `awalan`, `pcare_no_urut`, `jkn_nomor_kartu`, `keluhan_singkat`, `tanggal_daftar`, `status`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'menunggu')",
        [d.pasien_id, d.lokasi_id ?? null, d.jenis_poli, d.awalan, d.pcare_no_urut, d.jkn_nomor_kartu ?? null, d.keluhan_singkat ?? null, d.tanggal_daftar],
        koneksi,
    );
    return { id: hasil.insertId, count: hasil.affectedRows };
}

export async function tandaiAntreanSementaraJknDipindahkan(id, kunjungan_id, waktu = new Date(), koneksi = pool) {
    const hasil = await tulis(
        "UPDATE `antrean_sementara_jkn` SET `status` = 'dipindahkan', `kunjungan_id` = ?, `diubah_pada` = ? WHERE `id` = ? AND `status` = 'menunggu'",
        [kunjungan_id, waktu, id],
        koneksi,
    );
    return { count: hasil.affectedRows };
}

export async function batalkanAntreanSementaraJkn(id, waktu = new Date(), koneksi = pool) {
    const hasil = await tulis(
        "UPDATE `antrean_sementara_jkn` SET `status` = 'batal', `diubah_pada` = ? WHERE `id` = ? AND `status` = 'menunggu'",
        [waktu, id],
        koneksi,
    );
    return { count: hasil.affectedRows };
}

/** Seluruh kunjungan dalam satu sesi antrean (beserta pasien, antrean, dan DPJP utama). */
export async function daftarKunjunganDalamSesi(sesi_id, koneksi = pool) {
    const baris = await baca(
        "SELECT t0.`id` AS `t0__id`, t0.`id_layanan` AS `t0__id_layanan`, t0.`pasien_id` AS `t0__pasien_id`, t0.`jenis` AS `t0__jenis`, t0.`status` AS `t0__status`, t0.`tahap_layanan` AS `t0__tahap_layanan`, t0.`lokasi_id` AS `t0__lokasi_id`, t0.`cara_pembayaran` AS `t0__cara_pembayaran`, t0.`mulai` AS `t0__mulai`, t0.`waktu_tutup` AS `t0__waktu_tutup`, t0.`pcare_no_kunjungan` AS `t0__pcare_no_kunjungan`, t0.`pcare_status` AS `t0__pcare_status`, t0.`pcare_pesan` AS `t0__pcare_pesan`, t0.`encounter_id` AS `t0__encounter_id`, " +
        "t1.`id` AS `t1__id`, t1.`sesi_id` AS `t1__sesi_id`, t1.`lokasi_id` AS `t1__lokasi_id`, t1.`ruang_id` AS `t1__ruang_id`, t1.`nomor` AS `t1__nomor`, t1.`awalan` AS `t1__awalan`, t1.`jenis_poli` AS `t1__jenis_poli`, t1.`status` AS `t1__status`, " +
        "t2.`pengguna_id` AS `t2__pengguna_id`, " +
        "t3.`id` AS `t3__id`, t3.`nomor_rm` AS `t3__nomor_rm`, t3.`nama` AS `t3__nama`, t3.`tanggal_lahir` AS `t3__tanggal_lahir`, t3.`jenis_kelamin` AS `t3__jenis_kelamin`, t3.`status_identitas` AS `t3__status_identitas`, t3.`kode_wilayah` AS `t3__kode_wilayah`, t3.`jkn_nomor_kartu` AS `t3__jkn_nomor_kartu` " +
        "FROM `antrean` t1 " +
        "JOIN `kunjungan` t0 ON t0.`id` = t1.`kunjungan_id` " +
        "JOIN `pasien` t3 ON t3.`id` = t0.`pasien_id` " +
        "LEFT JOIN `peserta_kunjungan` t2 ON t2.`kunjungan_id` = t0.`id` AND t2.`tipe` = 'ATND' AND t2.`selesai` IS NULL " +
        "WHERE t1.`sesi_id` = ? " +
        "ORDER BY t0.`mulai` ASC, t0.`id` ASC",
        [sesi_id],
        koneksi,
    );
    const seen = new Map();
    for (const r of baris) {
        if (seen.has(r.t0__id))
            continue;
        seen.set(r.t0__id, {
            id: r.t0__id, id_layanan: r.t0__id_layanan, pasien_id: r.t0__pasien_id,
            jenis: r.t0__jenis, status: r.t0__status, tahap_layanan: r.t0__tahap_layanan, lokasi_id: r.t0__lokasi_id,
            cara_pembayaran: r.t0__cara_pembayaran, mulai: r.t0__mulai, waktu_tutup: r.t0__waktu_tutup,
            pcare_no_kunjungan: r.t0__pcare_no_kunjungan, pcare_status: r.t0__pcare_status, pcare_pesan: r.t0__pcare_pesan, encounter_id: r.t0__encounter_id,
            antrean: { id: r.t1__id, sesi_id: r.t1__sesi_id, lokasi_id: r.t1__lokasi_id, ruang_id: r.t1__ruang_id, nomor: r.t1__nomor, awalan: r.t1__awalan, jenis_poli: r.t1__jenis_poli, status: r.t1__status },
            peserta: r.t2__pengguna_id ? [{ pengguna_id: r.t2__pengguna_id }] : [],
            pasien: { id: r.t3__id, nomor_rm: r.t3__nomor_rm, nama: r.t3__nama, tanggal_lahir: r.t3__tanggal_lahir, jenis_kelamin: r.t3__jenis_kelamin, status_identitas: r.t3__status_identitas, kode_wilayah: r.t3__kode_wilayah, jkn_nomor_kartu: r.t3__jkn_nomor_kartu },
        });
    }
    return [...seen.values()];
}
