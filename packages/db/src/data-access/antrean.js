import { baca, tulis, pool } from '../koneksi.js';
export async function daftarAntreanUntukBuatRuteLayarPanggilan(sesi_id, lokasi_id, status, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`lokasi_id`, t.`ruang_id`, t.`nomor`, t.`awalan`, t.`jenis_poli`, t.`status`, t.`waktu_panggil`, (SELECT k.`tahap_layanan` FROM `kunjungan` k WHERE k.`id` = t.`kunjungan_id`) AS `tahap_layanan` FROM `antrean` t WHERE ((? OR t.`sesi_id` <=> ?)) AND ((? OR t.`lokasi_id` IN (?) OR t.`lokasi_id` IS NULL)) AND ((? OR t.`status` IN (?))) ORDER BY t.`waktu_panggil` DESC, t.`id` DESC", [sesi_id === undefined, sesi_id ?? null, lokasi_id === undefined, (lokasi_id)?.length ? (lokasi_id) : [null], status === undefined, (status)?.length ? (status) : [null]], koneksi);
    return baris;
}
export async function ubahAntreanUntukMulaiAntreanDalam(waktu_mulai, kunjungan_id, status, waktu_mulai2, koneksi = pool) {
    const hasil = await tulis("UPDATE `antrean` t SET `waktu_mulai` = IF(?, t.`waktu_mulai`, ?) WHERE ((? OR t.`kunjungan_id` <=> ?)) AND ((? OR t.`status` IN (?))) AND ((? OR t.`waktu_mulai` <=> ?))", [waktu_mulai === undefined, waktu_mulai ?? null, kunjungan_id === undefined, kunjungan_id ?? null, status === undefined, (status)?.length ? (status) : [null], waktu_mulai2 === undefined, waktu_mulai2 ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function ubahAntreanUntukMulaiAntreanDalam2(status, kunjungan_id, status2, koneksi = pool) {
    const hasil = await tulis("UPDATE `antrean` t SET `status` = IF(?, t.`status`, ?) WHERE ((? OR t.`kunjungan_id` <=> ?)) AND ((? OR t.`status` IN (?)))", [status === undefined, (status ?? null), kunjungan_id === undefined, kunjungan_id ?? null, status2 === undefined, (status2)?.length ? (status2) : [null]], koneksi);
    return { count: hasil.affectedRows };
}
export async function ubahAntreanUntukSelesaiAntreanDalam(waktu_selesai, kunjungan_id, status, waktu_selesai2, koneksi = pool) {
    const hasil = await tulis("UPDATE `antrean` t SET `waktu_selesai` = IF(?, t.`waktu_selesai`, ?) WHERE ((? OR t.`kunjungan_id` <=> ?)) AND ((? OR t.`status` IN (?))) AND ((? OR t.`waktu_selesai` <=> ?))", [waktu_selesai === undefined, waktu_selesai ?? null, kunjungan_id === undefined, kunjungan_id ?? null, status === undefined, (status)?.length ? (status) : [null], waktu_selesai2 === undefined, waktu_selesai2 ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function ringkasanAntreanUntukDaftarkan(awalan, sesi_id, koneksi = pool) {
    const baris = await baca("SELECT MAX(t.`nomor`) AS `_max_nomor` FROM `antrean` t WHERE t.`awalan` = ? AND t.`sesi_id` = ?", [awalan, sesi_id], koneksi);
    return { _max: { nomor: baris[0]?._max_nomor ?? null } };
}
/** Antrean baru untuk satu poli (`lokasi_id`; kosong untuk antrean laboratorium); ruang periksa ditetapkan saat dipanggil. */
export async function tambahAntreanUntukDaftarkan(sesi_id, kunjungan_id, lokasi_id, jenis_poli, awalan, tanggal, nomor, status, waktu_daftar, dibuat_oleh, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `antrean` (`sesi_id`, `kunjungan_id`, `lokasi_id`, `jenis_poli`, `awalan`, `tanggal`, `nomor`, `status`, `waktu_daftar`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [sesi_id, kunjungan_id, lokasi_id ?? null, jenis_poli, awalan, tanggal, nomor, status ?? 'menunggu', waktu_daftar ?? new Date(), dibuat_oleh ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function cariAntreanUntukStatusAntrean(id, koneksi = pool) {
    const baris = await baca("SELECT t.`status` FROM `antrean` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function ubahAntreanUntukUbahAntrean(status, waktu_panggil, waktu_mulai, waktu_selesai, id, status2, koneksi = pool) {
    const hasil = await tulis("UPDATE `antrean` t SET `status` = IF(?, t.`status`, ?), `waktu_panggil` = IF(?, t.`waktu_panggil`, ?), `waktu_mulai` = IF(?, t.`waktu_mulai`, ?), `waktu_selesai` = IF(?, t.`waktu_selesai`, ?) WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`status` IN (?)))", [status === undefined, (status ?? null), waktu_panggil === undefined, waktu_panggil ?? null, waktu_mulai === undefined, waktu_mulai ?? null, waktu_selesai === undefined, waktu_selesai ?? null, id === undefined, id ?? null, status2 === undefined, (status2)?.length ? (status2) : [null]], koneksi);
    return { count: hasil.affectedRows };
}
export async function wajibAntreanUntukUbahAntrean(id, koneksi = pool) {
    const baris = await baca("SELECT t.`sesi_id`, t.`lokasi_id`, t.`ruang_id`, t.`nomor`, t.`awalan`, t.`jenis_poli`, t.`kunjungan_id`, t.`tanggal` FROM `antrean` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    if (!baris[0])
        throw new Error('Baris antrean tidak ditemukan.');
    return baris[0];
}
export async function wajibAntreanUntukUbahAntrean2(id, koneksi = pool) {
    const baris = await baca("SELECT t.`kunjungan_id` FROM `antrean` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    if (!baris[0])
        throw new Error('Baris antrean tidak ditemukan.');
    return baris[0];
}
export async function hitungAntreanUntukDaftarAntrean(tanggal, lokasi_id, status, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `antrean` t WHERE ((? OR t.`tanggal` <=> ?)) AND ((? OR t.`lokasi_id` <=> ?)) AND ((? OR t.`status` <=> ?))", [tanggal === undefined, tanggal ?? null, lokasi_id === undefined, lokasi_id ?? null, status === undefined, status ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function daftarAntreanUntukPetakanAntrean(id, tanggal, lokasi_id, status, batas, lewati, koneksi = pool) {
    function petakt1(semua) {
        const grup = new Map();
        for (const baris of semua) {
            if (baris.t1__id === null)
                continue;
            const kunci = String(baris.t1__id);
            const isi = grup.get(kunci);
            if (isi)
                isi.push(baris);
            else
                grup.set(kunci, [baris]);
        }
        return [...grup.values()].map(baris => ({ pasien_id: baris[0].t1__pasien_id }));
    }
    function petakt0(semua) {
        const grup = new Map();
        for (const baris of semua) {
            if (baris.t0__id === null)
                continue;
            const kunci = String(baris.t0__id);
            const isi = grup.get(kunci);
            if (isi)
                isi.push(baris);
            else
                grup.set(kunci, [baris]);
        }
        return [...grup.values()].map(baris => ({ id: baris[0].t0__id, kunjungan_id: baris[0].t0__kunjungan_id, lokasi_id: baris[0].t0__lokasi_id, ruang_id: baris[0].t0__ruang_id, tanggal: baris[0].t0__tanggal, nomor: baris[0].t0__nomor, awalan: baris[0].t0__awalan, jenis_poli: baris[0].t0__jenis_poli, status: baris[0].t0__status, waktu_daftar: baris[0].t0__waktu_daftar, waktu_panggil: baris[0].t0__waktu_panggil, waktu_mulai: baris[0].t0__waktu_mulai, waktu_selesai: baris[0].t0__waktu_selesai, dibuat_oleh: baris[0].t0__dibuat_oleh, dibuat_pada: baris[0].t0__dibuat_pada, kunjungan: petakt1(baris)[0] }));
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`kunjungan_id` AS `t0__kunjungan_id`, t0.`lokasi_id` AS `t0__lokasi_id`, t0.`ruang_id` AS `t0__ruang_id`, t0.`tanggal` AS `t0__tanggal`, t0.`nomor` AS `t0__nomor`, t0.`awalan` AS `t0__awalan`, t0.`jenis_poli` AS `t0__jenis_poli`, t0.`status` AS `t0__status`, t0.`waktu_daftar` AS `t0__waktu_daftar`, t0.`waktu_panggil` AS `t0__waktu_panggil`, t0.`waktu_mulai` AS `t0__waktu_mulai`, t0.`waktu_selesai` AS `t0__waktu_selesai`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t1.`id` AS `t1__id`, t1.`pasien_id` AS `t1__pasien_id`\nFROM (SELECT t0.* FROM `antrean` t0 WHERE ((? OR t0.`id` <=> ?)) AND ((? OR t0.`tanggal` <=> ?)) AND ((? OR t0.`lokasi_id` <=> ?)) AND ((? OR t0.`status` <=> ?)) ORDER BY t0.`lokasi_id` ASC, t0.`nomor` ASC LIMIT ? OFFSET ?) t0\nLEFT JOIN (SELECT b1.* FROM `kunjungan` b1 WHERE TRUE) t1 ON t0.`kunjungan_id` = t1.`id`\nORDER BY t0.`lokasi_id` ASC, t0.`nomor` ASC, t1.`id` ASC", [id === undefined, id ?? null, tanggal === undefined, tanggal ?? null, lokasi_id === undefined, lokasi_id ?? null, status === undefined, status ?? null, batas ?? 2147483647, lewati ?? 0], koneksi);
    const hasil = petakt0(baris);
    return hasil;
}

/** Antrean yang sedang memegang ruang periksa: dipanggil atau dilayani dan kunjungannya masih di skrining/pemeriksaan; di luar antrean `kecuali_id`. */
export async function cariAntreanSibukUntukPanggil(ruang_id, sesi_id, kecuali_id, koneksi = pool) {
    const baris = await baca("SELECT a.`id`, a.`nomor`, a.`awalan`, a.`status` FROM `antrean` a JOIN `kunjungan` k ON k.`id` = a.`kunjungan_id` WHERE a.`ruang_id` = ? AND a.`sesi_id` = ? AND a.`status` IN ('dipanggil', 'dilayani') AND k.`tahap_layanan` IN ('menunggu_skrining', 'pemeriksaan') AND a.`id` <> ? ORDER BY a.`nomor` ASC LIMIT 1", [ruang_id, sesi_id, kecuali_id], koneksi);
    return baris[0] ?? null;
}
/** Antrean yang sedang memegang ruang periksa pada sesi aktif (untuk menandai ruang sibuk). */
export async function daftarAntreanSibukUntukPetakan(ruang_ids, sesi_id, koneksi = pool) {
    if (!ruang_ids.length || !sesi_id)
        return [];
    return baca("SELECT a.`id`, a.`ruang_id`, a.`nomor`, a.`awalan`, a.`status` FROM `antrean` a JOIN `kunjungan` k ON k.`id` = a.`kunjungan_id` WHERE a.`ruang_id` IN (?) AND a.`sesi_id` = ? AND a.`status` IN ('dipanggil', 'dilayani') AND k.`tahap_layanan` IN ('menunggu_skrining', 'pemeriksaan') ORDER BY a.`nomor` ASC", [ruang_ids, sesi_id], koneksi);
}
/** Antrean yang sedang ditangani seorang dokter (DPJP kunjungan) pada sesi aktif; satu dokter melayani satu pasien sekali waktu. */
export async function cariAntreanDokterSibuk(dpjp_id, sesi_id, kecuali_id, koneksi = pool) {
    const baris = await baca("SELECT a.`id`, a.`nomor`, a.`awalan` FROM `antrean` a JOIN `kunjungan` k ON k.`id` = a.`kunjungan_id` JOIN `peserta_kunjungan` p ON p.`kunjungan_id` = k.`id` AND p.`tipe` = 'ATND' AND p.`selesai` IS NULL WHERE p.`pengguna_id` = ? AND a.`sesi_id` = ? AND a.`status` IN ('dipanggil', 'dilayani') AND k.`tahap_layanan` IN ('menunggu_skrining', 'pemeriksaan') AND a.`id` <> ? ORDER BY a.`nomor` ASC LIMIT 1", [dpjp_id, sesi_id, kecuali_id], koneksi);
    return baris[0] ?? null;
}
/** Ruang periksa terakhir yang dipakai dokter pada sesi aktif (pasien berikutnya diarahkan ke ruang yang sama bila bebas). */
export async function cariRuangTerakhirDokter(dpjp_id, sesi_id, koneksi = pool) {
    const baris = await baca("SELECT a.`ruang_id` FROM `antrean` a JOIN `peserta_kunjungan` p ON p.`kunjungan_id` = a.`kunjungan_id` AND p.`tipe` = 'ATND' WHERE p.`pengguna_id` = ? AND a.`sesi_id` = ? AND a.`ruang_id` IS NOT NULL ORDER BY a.`waktu_panggil` DESC, a.`id` DESC LIMIT 1", [dpjp_id, sesi_id], koneksi);
    return baris[0]?.ruang_id ?? null;
}
/** Tetapkan (atau lepaskan dengan null) ruang periksa antrean. */
export async function tetapkanRuangAntrean(id, ruang_id, koneksi = pool) {
    const hasil = await tulis("UPDATE `antrean` a SET a.`ruang_id` = ? WHERE a.`id` = ?", [ruang_id, id], koneksi);
    return { count: hasil.affectedRows };
}

/** Tahap layanan kunjungan milik satu antrean; null bila antrean tidak ada. */
export async function cariTahapLayananUntukTahapAntrean(id, koneksi = pool) {
    const baris = await baca("SELECT k.`tahap_layanan` FROM `antrean` t JOIN `kunjungan` k ON k.`id` = t.`kunjungan_id` WHERE t.`id` = ? LIMIT 1", [id], koneksi);
    return baris[0]?.tahap_layanan ?? null;
}
