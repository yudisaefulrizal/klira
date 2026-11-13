import { baca, tulis, pool } from '../koneksi.js';
export async function daftarAntreanUntukBuatRuteLayarPanggilan(fasyankes_id, tanggal, lokasi_id, status, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`lokasi_id`, t.`nomor`, t.`status`, t.`waktu_panggil` FROM `antrean` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`tanggal` <=> ?)) AND ((? OR t.`lokasi_id` IN (?))) AND ((? OR t.`status` IN (?))) ORDER BY t.`waktu_panggil` DESC, t.`id` DESC", [fasyankes_id === undefined, fasyankes_id ?? null, tanggal === undefined, tanggal ?? null, lokasi_id === undefined, (lokasi_id)?.length ? (lokasi_id) : [null], status === undefined, (status)?.length ? (status) : [null]], koneksi);
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
export async function ringkasanAntreanUntukDaftarkan(fasyankes_id, lokasi_id, tanggal, koneksi = pool) {
    const baris = await baca("SELECT MAX(t.`nomor`) AS `_max_nomor` FROM `antrean` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`lokasi_id` <=> ?)) AND ((? OR t.`tanggal` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null, lokasi_id === undefined, lokasi_id ?? null, tanggal === undefined, tanggal ?? null], koneksi);
    const hasil = baris.map(b => ({ _max: { nomor: b._max_nomor } }));
    return hasil[0];
}
export async function tambahAntreanUntukDaftarkan(fasyankes_id, kunjungan_id, lokasi_id, tanggal, nomor, status, waktu_daftar, dibuat_oleh, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `antrean` (`fasyankes_id`, `kunjungan_id`, `lokasi_id`, `tanggal`, `nomor`, `status`, `waktu_daftar`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (kunjungan_id === undefined ? null : kunjungan_id) ?? null, (lokasi_id === undefined ? null : lokasi_id) ?? null, (tanggal === undefined ? null : tanggal) ?? null, (nomor === undefined ? null : nomor) ?? null, ((status === undefined ? "menunggu" : status) ?? null), (waktu_daftar === undefined ? new Date() : waktu_daftar) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
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
    const baris = await baca("SELECT t.`lokasi_id`, t.`nomor`, t.`tanggal` FROM `antrean` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
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
        return [...grup.values()].map(baris => ({ id: baris[0].t0__id, fasyankes_id: baris[0].t0__fasyankes_id, kunjungan_id: baris[0].t0__kunjungan_id, lokasi_id: baris[0].t0__lokasi_id, tanggal: baris[0].t0__tanggal, nomor: baris[0].t0__nomor, status: baris[0].t0__status, waktu_daftar: baris[0].t0__waktu_daftar, waktu_panggil: baris[0].t0__waktu_panggil, waktu_mulai: baris[0].t0__waktu_mulai, waktu_selesai: baris[0].t0__waktu_selesai, dibuat_oleh: baris[0].t0__dibuat_oleh, dibuat_pada: baris[0].t0__dibuat_pada, kunjungan: petakt1(baris)[0] }));
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`fasyankes_id` AS `t0__fasyankes_id`, t0.`kunjungan_id` AS `t0__kunjungan_id`, t0.`lokasi_id` AS `t0__lokasi_id`, t0.`tanggal` AS `t0__tanggal`, t0.`nomor` AS `t0__nomor`, t0.`status` AS `t0__status`, t0.`waktu_daftar` AS `t0__waktu_daftar`, t0.`waktu_panggil` AS `t0__waktu_panggil`, t0.`waktu_mulai` AS `t0__waktu_mulai`, t0.`waktu_selesai` AS `t0__waktu_selesai`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t1.`id` AS `t1__id`, t1.`pasien_id` AS `t1__pasien_id`\nFROM (SELECT t0.* FROM `antrean` t0 WHERE ((? OR t0.`id` <=> ?)) AND ((? OR t0.`fasyankes_id` <=> ?)) AND ((? OR t0.`tanggal` <=> ?)) AND ((? OR t0.`lokasi_id` <=> ?)) AND ((? OR t0.`status` <=> ?)) AND ((? OR t0.`fasyankes_id` <=> ?)) ORDER BY t0.`lokasi_id` ASC, t0.`nomor` ASC LIMIT ? OFFSET ?) t0\nLEFT JOIN (SELECT b1.* FROM `kunjungan` b1 WHERE TRUE) t1 ON t0.`kunjungan_id` = t1.`id`\nORDER BY t0.`lokasi_id` ASC, t0.`nomor` ASC, t1.`id` ASC", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null, tanggal === undefined, tanggal ?? null, lokasi_id === undefined, lokasi_id ?? null, status === undefined, status ?? null, fasyankes_id2 === undefined, fasyankes_id2 ?? null, batas ?? 2147483647, lewati ?? 0], koneksi);
    const hasil = petakt0(baris);
    return hasil;
}

/** Antrean yang sedang memegang poli: dipanggil atau dilayani dan kunjungannya masih di tahap skrining/pemeriksaan; di luar antrean `kecuali_id`. */
export async function cariAntreanSibukUntukPanggil(fasyankes_id, lokasi_id, tanggal, kecuali_id, koneksi = pool) {
    const baris = await baca("SELECT a.`id`, a.`nomor`, a.`status` FROM `antrean` a JOIN `kunjungan` k ON k.`id` = a.`kunjungan_id` WHERE a.`fasyankes_id` = ? AND a.`lokasi_id` = ? AND a.`tanggal` = ? AND a.`status` IN ('dipanggil', 'dilayani') AND k.`tahap_layanan` IN ('menunggu_skrining', 'pemeriksaan') AND a.`id` <> ? ORDER BY a.`nomor` ASC LIMIT 1", [fasyankes_id, lokasi_id, tanggal, kecuali_id], koneksi);
    return baris[0] ?? null;
}
/** Antrean yang sedang memegang poli (satu per poli bila aturan panggil dijaga), untuk daftar poli pada satu hari. */
export async function daftarAntreanSibukUntukPetakan(fasyankes_id, lokasi_ids, tanggal, koneksi = pool) {
    if (!lokasi_ids.length)
        return [];
    return baca("SELECT a.`id`, a.`lokasi_id`, a.`nomor`, a.`status` FROM `antrean` a JOIN `kunjungan` k ON k.`id` = a.`kunjungan_id` WHERE a.`fasyankes_id` = ? AND a.`lokasi_id` IN (?) AND a.`tanggal` = ? AND a.`status` IN ('dipanggil', 'dilayani') AND k.`tahap_layanan` IN ('menunggu_skrining', 'pemeriksaan') ORDER BY a.`nomor` ASC", [fasyankes_id, lokasi_ids, tanggal], koneksi);
}
