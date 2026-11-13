import { baca, tulis, pool } from '../koneksi.js';
export async function daftarAntreanUntukBuatRuteLayarPanggilan(fasyankes_id, tanggal, lokasi_id, status, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`lokasi_id`, t.`nomor`, t.`awalan`, t.`jenis_poli`, t.`status`, t.`waktu_panggil` FROM `antrean` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`tanggal` <=> ?)) AND ((? OR t.`lokasi_id` IN (?) OR t.`lokasi_id` IS NULL)) AND ((? OR t.`status` IN (?))) ORDER BY t.`waktu_panggil` DESC, t.`id` DESC", [fasyankes_id === undefined, fasyankes_id ?? null, tanggal === undefined, tanggal ?? null, lokasi_id === undefined, (lokasi_id)?.length ? (lokasi_id) : [null], status === undefined, (status)?.length ? (status) : [null]], koneksi);
    return baris;
}
export async function ubahAntreanUntukMulaiAntreanDalam(waktu_mulai, fasyankes_id, kunjungan_id, status, waktu_mulai2, koneksi = pool) {
    const hasil = await tulis("UPDATE `antrean` t SET `waktu_mulai` = IF(?, t.`waktu_mulai`, ?) WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`kunjungan_id` <=> ?)) AND ((? OR t.`status` IN (?))) AND ((? OR t.`waktu_mulai` <=> ?))", [waktu_mulai === undefined, waktu_mulai ?? null, fasyankes_id === undefined, fasyankes_id ?? null, kunjungan_id === undefined, kunjungan_id ?? null, status === undefined, (status)?.length ? (status) : [null], waktu_mulai2 === undefined, waktu_mulai2 ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function ubahAntreanUntukMulaiAntreanDalam2(status, fasyankes_id, kunjungan_id, status2, koneksi = pool) {
    const hasil = await tulis("UPDATE `antrean` t SET `status` = IF(?, t.`status`, ?) WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`kunjungan_id` <=> ?)) AND ((? OR t.`status` IN (?)))", [status === undefined, (status ?? null), fasyankes_id === undefined, fasyankes_id ?? null, kunjungan_id === undefined, kunjungan_id ?? null, status2 === undefined, (status2)?.length ? (status2) : [null]], koneksi);
    return { count: hasil.affectedRows };
}
export async function ubahAntreanUntukSelesaiAntreanDalam(waktu_selesai, fasyankes_id, kunjungan_id, status, waktu_selesai2, koneksi = pool) {
    const hasil = await tulis("UPDATE `antrean` t SET `waktu_selesai` = IF(?, t.`waktu_selesai`, ?) WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`kunjungan_id` <=> ?)) AND ((? OR t.`status` IN (?))) AND ((? OR t.`waktu_selesai` <=> ?))", [waktu_selesai === undefined, waktu_selesai ?? null, fasyankes_id === undefined, fasyankes_id ?? null, kunjungan_id === undefined, kunjungan_id ?? null, status === undefined, (status)?.length ? (status) : [null], waktu_selesai2 === undefined, waktu_selesai2 ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function ringkasanAntreanUntukDaftarkan(fasyankes_id, awalan, tanggal, koneksi = pool) {
    const baris = await baca("SELECT MAX(t.`nomor`) AS `_max_nomor` FROM `antrean` t WHERE t.`fasyankes_id` = ? AND t.`awalan` = ? AND t.`tanggal` = ?", [fasyankes_id, awalan, tanggal], koneksi);
    return { _max: { nomor: baris[0]?._max_nomor ?? null } };
}
/** Antrean baru untuk satu jenis poli; poli (`lokasi_id`) kosong sampai dipanggil. */
export async function tambahAntreanUntukDaftarkan(fasyankes_id, kunjungan_id, jenis_poli, awalan, tanggal, nomor, status, waktu_daftar, dibuat_oleh, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `antrean` (`fasyankes_id`, `kunjungan_id`, `lokasi_id`, `jenis_poli`, `awalan`, `tanggal`, `nomor`, `status`, `waktu_daftar`, `dibuat_oleh`) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?)", [fasyankes_id, kunjungan_id, jenis_poli, awalan, tanggal, nomor, status ?? 'menunggu', waktu_daftar ?? new Date(), dibuat_oleh ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function cariAntreanUntukStatusAntrean(id, fasyankes_id, koneksi = pool) {
    const baris = await baca("SELECT t.`status` FROM `antrean` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) LIMIT 1", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function ubahAntreanUntukUbahAntrean(status, waktu_panggil, waktu_mulai, waktu_selesai, id, fasyankes_id, status2, koneksi = pool) {
    const hasil = await tulis("UPDATE `antrean` t SET `status` = IF(?, t.`status`, ?), `waktu_panggil` = IF(?, t.`waktu_panggil`, ?), `waktu_mulai` = IF(?, t.`waktu_mulai`, ?), `waktu_selesai` = IF(?, t.`waktu_selesai`, ?) WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`status` IN (?)))", [status === undefined, (status ?? null), waktu_panggil === undefined, waktu_panggil ?? null, waktu_mulai === undefined, waktu_mulai ?? null, waktu_selesai === undefined, waktu_selesai ?? null, id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null, status2 === undefined, (status2)?.length ? (status2) : [null]], koneksi);
    return { count: hasil.affectedRows };
}
export async function wajibAntreanUntukUbahAntrean(id, koneksi = pool) {
    const baris = await baca("SELECT t.`lokasi_id`, t.`nomor`, t.`awalan`, t.`jenis_poli`, t.`kunjungan_id`, t.`tanggal` FROM `antrean` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
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
export async function hitungAntreanUntukDaftarAntrean(fasyankes_id, tanggal, lokasi_id, status, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `antrean` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`tanggal` <=> ?)) AND ((? OR t.`lokasi_id` <=> ?)) AND ((? OR t.`status` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null, tanggal === undefined, tanggal ?? null, lokasi_id === undefined, lokasi_id ?? null, status === undefined, status ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function daftarAntreanUntukPetakanAntrean(id, fasyankes_id, tanggal, lokasi_id, status, fasyankes_id2, batas, lewati, koneksi = pool) {
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
        return [...grup.values()].map(baris => ({ id: baris[0].t0__id, fasyankes_id: baris[0].t0__fasyankes_id, kunjungan_id: baris[0].t0__kunjungan_id, lokasi_id: baris[0].t0__lokasi_id, tanggal: baris[0].t0__tanggal, nomor: baris[0].t0__nomor, awalan: baris[0].t0__awalan, jenis_poli: baris[0].t0__jenis_poli, status: baris[0].t0__status, waktu_daftar: baris[0].t0__waktu_daftar, waktu_panggil: baris[0].t0__waktu_panggil, waktu_mulai: baris[0].t0__waktu_mulai, waktu_selesai: baris[0].t0__waktu_selesai, dibuat_oleh: baris[0].t0__dibuat_oleh, dibuat_pada: baris[0].t0__dibuat_pada, kunjungan: petakt1(baris)[0] }));
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`fasyankes_id` AS `t0__fasyankes_id`, t0.`kunjungan_id` AS `t0__kunjungan_id`, t0.`lokasi_id` AS `t0__lokasi_id`, t0.`tanggal` AS `t0__tanggal`, t0.`nomor` AS `t0__nomor`, t0.`awalan` AS `t0__awalan`, t0.`jenis_poli` AS `t0__jenis_poli`, t0.`status` AS `t0__status`, t0.`waktu_daftar` AS `t0__waktu_daftar`, t0.`waktu_panggil` AS `t0__waktu_panggil`, t0.`waktu_mulai` AS `t0__waktu_mulai`, t0.`waktu_selesai` AS `t0__waktu_selesai`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t1.`id` AS `t1__id`, t1.`pasien_id` AS `t1__pasien_id`\nFROM (SELECT t0.* FROM `antrean` t0 WHERE ((? OR t0.`id` <=> ?)) AND ((? OR t0.`fasyankes_id` <=> ?)) AND ((? OR t0.`tanggal` <=> ?)) AND ((? OR t0.`lokasi_id` <=> ?)) AND ((? OR t0.`status` <=> ?)) AND ((? OR t0.`fasyankes_id` <=> ?)) ORDER BY t0.`lokasi_id` ASC, t0.`nomor` ASC LIMIT ? OFFSET ?) t0\nLEFT JOIN (SELECT b1.* FROM `kunjungan` b1 WHERE TRUE) t1 ON t0.`kunjungan_id` = t1.`id`\nORDER BY t0.`lokasi_id` ASC, t0.`nomor` ASC, t1.`id` ASC", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null, tanggal === undefined, tanggal ?? null, lokasi_id === undefined, lokasi_id ?? null, status === undefined, status ?? null, fasyankes_id2 === undefined, fasyankes_id2 ?? null, batas ?? 2147483647, lewati ?? 0], koneksi);
    const hasil = petakt0(baris);
    return hasil;
}

/** Antrean yang sedang memegang poli: dipanggil atau dilayani dan kunjungannya masih di tahap skrining/pemeriksaan; di luar antrean `kecuali_id`. */
export async function cariAntreanSibukUntukPanggil(fasyankes_id, lokasi_id, tanggal, kecuali_id, koneksi = pool) {
    const baris = await baca("SELECT a.`id`, a.`nomor`, a.`awalan`, a.`status` FROM `antrean` a JOIN `kunjungan` k ON k.`id` = a.`kunjungan_id` WHERE a.`fasyankes_id` = ? AND a.`lokasi_id` = ? AND a.`tanggal` = ? AND a.`status` IN ('dipanggil', 'dilayani') AND k.`tahap_layanan` IN ('menunggu_skrining', 'pemeriksaan') AND a.`id` <> ? ORDER BY a.`nomor` ASC LIMIT 1", [fasyankes_id, lokasi_id, tanggal, kecuali_id], koneksi);
    return baris[0] ?? null;
}
/** Antrean yang sedang memegang poli (satu per poli bila aturan panggil dijaga), untuk daftar poli pada satu hari. */
export async function daftarAntreanSibukUntukPetakan(fasyankes_id, lokasi_ids, tanggal, koneksi = pool) {
    if (!lokasi_ids.length)
        return [];
    return baca("SELECT a.`id`, a.`lokasi_id`, a.`nomor`, a.`awalan`, a.`status` FROM `antrean` a JOIN `kunjungan` k ON k.`id` = a.`kunjungan_id` WHERE a.`fasyankes_id` = ? AND a.`lokasi_id` IN (?) AND a.`tanggal` = ? AND a.`status` IN ('dipanggil', 'dilayani') AND k.`tahap_layanan` IN ('menunggu_skrining', 'pemeriksaan') ORDER BY a.`nomor` ASC", [fasyankes_id, lokasi_ids, tanggal], koneksi);
}

/** Poli operasional untuk satu jenis yang sedang bebas pada tanggal itu (tidak memegang antrean dipanggil/dilayani di skrining/pemeriksaan). Bila `dpjp_id` ada, hanya poli tempat dokter itu punya jadwal aktif. */
export async function daftarPoliBebasUntukPanggil(fasyankes_id, jenis_poli, tanggal, dpjp_id, koneksi = pool) {
    return baca("SELECT l.`id`, l.`nama` FROM `lokasi` l WHERE l.`fasyankes_id` = ? AND l.`jenis` = 'poli' AND l.`status_operasional` = 'O' AND LOWER(l.`jenis_poli`) = LOWER(?) AND NOT EXISTS (SELECT 1 FROM `antrean` a JOIN `kunjungan` k ON k.`id` = a.`kunjungan_id` WHERE a.`lokasi_id` = l.`id` AND a.`tanggal` = ? AND a.`status` IN ('dipanggil', 'dilayani') AND k.`tahap_layanan` IN ('menunggu_skrining', 'pemeriksaan')) AND (? IS NULL OR EXISTS (SELECT 1 FROM `jadwal_praktik` j WHERE j.`lokasi_id` = l.`id` AND j.`pengguna_id` = ? AND j.`aktif` = 1)) ORDER BY l.`id` ASC", [fasyankes_id, jenis_poli, tanggal, dpjp_id ?? null, dpjp_id ?? null], koneksi);
}
/** Tetapkan poli pada antrean yang dipanggil pertama kali, dan salin ke kunjungan. */
export async function ubahAntreanUntukTetapkanPoli(id, lokasi_id, koneksi = pool) {
    const hasil = await tulis("UPDATE `antrean` a JOIN `kunjungan` k ON k.`id` = a.`kunjungan_id` SET a.`lokasi_id` = ?, k.`lokasi_id` = ? WHERE a.`id` = ?", [lokasi_id, lokasi_id, id], koneksi);
    return { count: hasil.affectedRows };
}
/** Poli (operasional) tempat dokter punya jadwal aktif, untuk satu jenis poli. */
export async function hitungPoliDokterUntukJenis(fasyankes_id, jenis_poli, dpjp_id, koneksi = pool) {
    const [b] = await baca("SELECT COUNT(DISTINCT l.`id`) AS jumlah FROM `lokasi` l JOIN `jadwal_praktik` j ON j.`lokasi_id` = l.`id` AND j.`aktif` = 1 AND j.`pengguna_id` = ? WHERE l.`fasyankes_id` = ? AND l.`jenis` = 'poli' AND l.`status_operasional` = 'O' AND LOWER(l.`jenis_poli`) = LOWER(?)", [dpjp_id, fasyankes_id, jenis_poli], koneksi);
    return Number(b.jumlah);
}
