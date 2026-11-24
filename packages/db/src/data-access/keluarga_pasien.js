import { baca, tulis, pool } from '../koneksi.js';
import { kelompokkan } from '../pemeta.js';
import { wajibId } from '../wajib.js';
export async function cariKeluargaPasienUntukDataCetak(anggota_pasien_id, koneksi = pool) {
    function petakt1(semua) {
        return kelompokkan(semua, 't1', [
            'nama', 'nomor_rm',
        ]);
    }
    function petakt0(semua) {
        return kelompokkan(semua, 't0', [
            'id', 'pasien_id', 'anggota_pasien_id', 'hubungan', 'dibatasi', 'dibuat_oleh', 'dibuat_pada',
            ['pasien', (baris) => petakt1(baris)[0]],
        ]);
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`pasien_id` AS `t0__pasien_id`, t0.`anggota_pasien_id` AS `t0__anggota_pasien_id`, t0.`hubungan` AS `t0__hubungan`, t0.`dibatasi` AS `t0__dibatasi`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t1.`id` AS `t1__id`, t1.`nama` AS `t1__nama`, t1.`nomor_rm` AS `t1__nomor_rm`\nFROM (SELECT t0.* FROM `keluarga_pasien` t0 WHERE ((? OR t0.`anggota_pasien_id` <=> ?)) ORDER BY t0.`id` ASC LIMIT 1) t0\nLEFT JOIN (SELECT b1.* FROM `pasien` b1 WHERE TRUE) t1 ON t0.`pasien_id` = t1.`id`\nORDER BY t0.`id` ASC, t1.`id` ASC", [anggota_pasien_id === undefined, anggota_pasien_id ?? null], koneksi);
    const hasil = petakt0(baris);
    return (hasil[0] ?? null);
}
export async function daftarKeluargaPasienUntukFolderKeluarga(pasien_id, batas, koneksi = pool) {
    function petakt1(semua) {
        return kelompokkan(semua, 't1', [
            'id', 'nama', 'nomor_rm',
        ]);
    }
    function petakt0(semua) {
        return kelompokkan(semua, 't0', [
            'id', 'pasien_id', 'anggota_pasien_id', 'hubungan', 'dibatasi', 'dibuat_oleh', 'dibuat_pada',
            ['anggota', (baris) => petakt1(baris)[0]],
        ]);
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`pasien_id` AS `t0__pasien_id`, t0.`anggota_pasien_id` AS `t0__anggota_pasien_id`, t0.`hubungan` AS `t0__hubungan`, t0.`dibatasi` AS `t0__dibatasi`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t1.`id` AS `t1__id`, t1.`nama` AS `t1__nama`, t1.`nomor_rm` AS `t1__nomor_rm`\nFROM (SELECT t0.* FROM `keluarga_pasien` t0 WHERE ((? OR t0.`pasien_id` <=> ?)) ORDER BY t0.`id` ASC LIMIT ? OFFSET ?) t0\nLEFT JOIN (SELECT b1.* FROM `pasien` b1 WHERE TRUE) t1 ON t0.`anggota_pasien_id` = t1.`id`\nORDER BY t0.`id` ASC, t1.`id` ASC", [pasien_id === undefined, pasien_id ?? null, batas ?? 2147483647, 0], koneksi);
    const hasil = petakt0(baris);
    return hasil;
}
export async function tambahKeluargaPasienUntukTautkanKeluarga(pasien_id, anggota_pasien_id, hubungan, dibuat_oleh, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `keluarga_pasien` (`pasien_id`, `anggota_pasien_id`, `hubungan`, `dibuat_oleh`) VALUES (?, ?, ?, ?)", [(pasien_id === undefined ? null : pasien_id) ?? null, (anggota_pasien_id === undefined ? null : anggota_pasien_id) ?? null, (hubungan === undefined ? null : hubungan) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function tambahKeluargaPasienUntukTautkanKeluargaHasil(id, koneksi = pool) {
    function petakt1(semua) {
        return kelompokkan(semua, 't1', [
            'id', 'nama', 'nomor_rm',
        ]);
    }
    function petakt0(semua) {
        return kelompokkan(semua, 't0', [
            'id', 'pasien_id', 'anggota_pasien_id', 'hubungan', 'dibatasi', 'dibuat_oleh', 'dibuat_pada',
            ['anggota', (baris) => petakt1(baris)[0]],
        ]);
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`pasien_id` AS `t0__pasien_id`, t0.`anggota_pasien_id` AS `t0__anggota_pasien_id`, t0.`hubungan` AS `t0__hubungan`, t0.`dibatasi` AS `t0__dibatasi`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t1.`id` AS `t1__id`, t1.`nama` AS `t1__nama`, t1.`nomor_rm` AS `t1__nomor_rm`\nFROM (SELECT t0.* FROM `keluarga_pasien` t0 WHERE ((? OR t0.`id` <=> ?)) LIMIT 1) t0\nLEFT JOIN (SELECT b1.* FROM `pasien` b1 WHERE TRUE) t1 ON t0.`anggota_pasien_id` = t1.`id`\nORDER BY t1.`id` ASC", [id === undefined, id ?? null], koneksi);
    const hasil = petakt0(baris);
    if (!hasil[0])
        throw new Error('Baris keluarga_pasien tidak ditemukan.');
    return hasil[0];
}
export async function ubahKeluargaPasienUntukUbahKeluarga(hubungan, dibatasi, id, pasien_id, koneksi = pool) {
    wajibId('ubahKeluargaPasienUntukUbahKeluarga', id);
    const hasil = await tulis("UPDATE `keluarga_pasien` t SET `hubungan` = IF(?, t.`hubungan`, ?), `dibatasi` = IF(?, t.`dibatasi`, ?) WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`pasien_id` <=> ?))", [hubungan === undefined, hubungan ?? null, dibatasi === undefined, dibatasi ?? null, id === undefined, id ?? null, pasien_id === undefined, pasien_id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
