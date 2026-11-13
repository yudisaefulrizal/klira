import { baca, tulis, pool } from '../koneksi.js';
export async function daftarPenugasanJenisUntukDaftarJenisAkun(fasyankes_id, mulai, selesai, selesai2, koneksi = pool) {
    const baris = await baca("SELECT DISTINCT t.`jenis_akun_id`, t.`pengguna_id` FROM `penugasan_jenis` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`mulai` <= ?)) AND ((((? OR t.`selesai` <=> ?))) OR (((? OR t.`selesai` > ?))))", [fasyankes_id === undefined, fasyankes_id ?? null, mulai === undefined, mulai ?? null, selesai === undefined, selesai ?? null, selesai2 === undefined, selesai2 ?? null], koneksi);
    return baris;
}
export async function daftarPenugasanJenisUntukDaftarPenugasan(pengguna_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`pengguna_id`, t.`jenis_akun_id`, t.`mulai`, t.`selesai`, t.`ditetapkan_oleh` FROM `penugasan_jenis` t WHERE ((? OR t.`pengguna_id` <=> ?)) ORDER BY t.`id` ASC", [pengguna_id === undefined, pengguna_id ?? null], koneksi);
    return baris;
}
export async function cariPenugasanJenisUntukAmbilPenugasan(id, pengguna_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`pengguna_id`, t.`jenis_akun_id`, t.`mulai`, t.`selesai`, t.`ditetapkan_oleh` FROM `penugasan_jenis` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`pengguna_id` <=> ?)) LIMIT 1", [id === undefined, id ?? null, pengguna_id === undefined, pengguna_id ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function tambahPenugasanJenisUntukBuatPenugasan(fasyankes_id, pengguna_id, jenis_akun_id, mulai, selesai, ditetapkan_oleh, dibuat_oleh, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `penugasan_jenis` (`fasyankes_id`, `pengguna_id`, `jenis_akun_id`, `mulai`, `selesai`, `ditetapkan_oleh`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (pengguna_id === undefined ? null : pengguna_id) ?? null, (jenis_akun_id === undefined ? null : jenis_akun_id) ?? null, (mulai === undefined ? null : mulai) ?? null, (selesai === undefined ? null : selesai) ?? null, (ditetapkan_oleh === undefined ? null : ditetapkan_oleh) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function tambahPenugasanJenisUntukBuatPenugasanHasil(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`pengguna_id`, t.`jenis_akun_id`, t.`mulai`, t.`selesai`, t.`ditetapkan_oleh` FROM `penugasan_jenis` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    if (!baris[0])
        throw new Error('Baris penugasan_jenis tidak ditemukan.');
    return baris[0];
}
export async function ubahPenugasanJenisUntukAkhiriPenugasan(selesai, id, koneksi = pool) {
    const hasil = await tulis("UPDATE `penugasan_jenis` t SET `selesai` = IF(?, t.`selesai`, ?) WHERE ((? OR t.`id` <=> ?))", [selesai === undefined, selesai ?? null, id === undefined, id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function daftarPenugasanJenisUntukJenisAkunPemberiHak(fasyankes_id, pengguna_id, mulai, selesai, selesai2, aktif, fitur, aksi, koneksi = pool) {
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
        return [...grup.values()].map(baris => ({ id: baris[0].t1__id, nama: baris[0].t1__nama }));
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
        return [...grup.values()].map(baris => ({ jenis_akun: petakt1(baris)[0] }));
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t1.`id` AS `t1__id`, t1.`nama` AS `t1__nama`\nFROM (SELECT t0.* FROM `penugasan_jenis` t0 WHERE ((? OR t0.`fasyankes_id` <=> ?)) AND ((? OR t0.`pengguna_id` <=> ?)) AND ((? OR t0.`mulai` <= ?)) AND ((((? OR t0.`selesai` <=> ?))) OR (((? OR t0.`selesai` > ?)))) AND (EXISTS (SELECT 1 FROM `jenis_akun` r1 WHERE t0.`jenis_akun_id` = r1.`id` AND (((? OR r1.`aktif` <=> ?)) AND (EXISTS (SELECT 1 FROM `izin_jenis_akun` r2 WHERE r1.`id` = r2.`jenis_akun_id` AND ((EXISTS (SELECT 1 FROM `izin` r3 WHERE r2.`izin_id` = r3.`id` AND (((? OR r3.`fitur` <=> ?)) AND ((? OR r3.`aksi` <=> ?))))))))))) ORDER BY t0.`jenis_akun_id` ASC) t0\nLEFT JOIN (SELECT b1.* FROM `jenis_akun` b1 WHERE TRUE) t1 ON t0.`jenis_akun_id` = t1.`id`\nORDER BY t0.`jenis_akun_id` ASC, t1.`id` ASC", [fasyankes_id === undefined, fasyankes_id ?? null, pengguna_id === undefined, pengguna_id ?? null, mulai === undefined, mulai ?? null, selesai === undefined, selesai ?? null, selesai2 === undefined, selesai2 ?? null, aktif === undefined, aktif ?? null, fitur === undefined, fitur ?? null, aksi === undefined, aksi ?? null], koneksi);
    const hasil = petakt0(baris);
    return hasil;
}
export async function tambahPenugasanJenisUntukBuatAkun(fasyankes_id, pengguna_id, jenis_akun_id, mulai, selesai, ditetapkan_oleh, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `penugasan_jenis` (`fasyankes_id`, `pengguna_id`, `jenis_akun_id`, `mulai`, `selesai`, `ditetapkan_oleh`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (pengguna_id === undefined ? null : pengguna_id) ?? null, (jenis_akun_id === undefined ? null : jenis_akun_id) ?? null, (mulai === undefined ? null : mulai) ?? null, (selesai === undefined ? null : selesai) ?? null, (ditetapkan_oleh === undefined ? null : ditetapkan_oleh) ?? null, (ditetapkan_oleh === undefined ? null : ditetapkan_oleh) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function tambahPenugasanJenisUntukBuatAkunHasil(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`pengguna_id`, t.`jenis_akun_id`, t.`mulai`, t.`selesai`, t.`ditetapkan_oleh`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `penugasan_jenis` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    if (!baris[0])
        throw new Error('Baris penugasan_jenis tidak ditemukan.');
    return baris[0];
}
export async function tambahPenugasanJenisUntukSeedPimpinanPertama(fasyankes_id, pengguna_id, jenis_akun_id, mulai, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `penugasan_jenis` (`fasyankes_id`, `pengguna_id`, `jenis_akun_id`, `mulai`) VALUES (?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (pengguna_id === undefined ? null : pengguna_id) ?? null, (jenis_akun_id === undefined ? null : jenis_akun_id) ?? null, (mulai === undefined ? null : mulai) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
