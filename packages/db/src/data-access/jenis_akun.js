import { baca, tulis, pool } from '../koneksi.js';
import { kelompokkan } from '../pemeta.js';
export async function daftarJenisAkunUntukDaftarJenisAkun(koneksi = pool) {
    function petakt2(semua) {
        return kelompokkan(semua, 't2', [
            'id', 'fitur', 'aksi', 'cakupan', 'dibuat_oleh', 'dibuat_pada',
        ]);
    }
    function petakt1(semua) {
        return kelompokkan(semua, 't1', [
            'id', 'jenis_akun_id', 'izin_id', 'dibuat_oleh', 'dibuat_pada',
            ['izin', (baris) => petakt2(baris)[0]],
        ]);
    }
    function petakt0(semua) {
        return kelompokkan(semua, 't0', [
            'id', 'nama', 'syarat_profesi', 'aktif', 'diubah_oleh', 'alasan_perubahan', 'dibuat_oleh', 'dibuat_pada',
            ['izin', (baris) => petakt1(baris)],
        ]);
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`nama` AS `t0__nama`, t0.`syarat_profesi` AS `t0__syarat_profesi`, t0.`aktif` AS `t0__aktif`, t0.`diubah_oleh` AS `t0__diubah_oleh`, t0.`alasan_perubahan` AS `t0__alasan_perubahan`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t1.`id` AS `t1__id`, t1.`jenis_akun_id` AS `t1__jenis_akun_id`, t1.`izin_id` AS `t1__izin_id`, t1.`dibuat_oleh` AS `t1__dibuat_oleh`, t1.`dibuat_pada` AS `t1__dibuat_pada`, t2.`id` AS `t2__id`, t2.`fitur` AS `t2__fitur`, t2.`aksi` AS `t2__aksi`, t2.`cakupan` AS `t2__cakupan`, t2.`dibuat_oleh` AS `t2__dibuat_oleh`, t2.`dibuat_pada` AS `t2__dibuat_pada`\nFROM (SELECT t0.* FROM `jenis_akun` t0 WHERE TRUE ORDER BY t0.`id` ASC) t0\nLEFT JOIN (SELECT b1.* FROM `izin_jenis_akun` b1 WHERE TRUE) t1 ON t0.`id` = t1.`jenis_akun_id`\nLEFT JOIN (SELECT b2.* FROM `izin` b2 WHERE TRUE) t2 ON t1.`izin_id` = t2.`id`\nORDER BY t0.`id` ASC, t1.`id` ASC, t2.`id` ASC", [], koneksi);
    const hasil = petakt0(baris);
    return hasil;
}
export async function cariJenisAkunUntukAmbilJenisAkun(id, koneksi = pool) {
    function petakt2(semua) {
        return kelompokkan(semua, 't2', [
            'id', 'fitur', 'aksi', 'cakupan', 'dibuat_oleh', 'dibuat_pada',
        ]);
    }
    function petakt1(semua) {
        return kelompokkan(semua, 't1', [
            'id', 'jenis_akun_id', 'izin_id', 'dibuat_oleh', 'dibuat_pada',
            ['izin', (baris) => petakt2(baris)[0]],
        ]);
    }
    function petakt0(semua) {
        return kelompokkan(semua, 't0', [
            'id', 'nama', 'syarat_profesi', 'aktif', 'diubah_oleh', 'alasan_perubahan', 'dibuat_oleh', 'dibuat_pada',
            ['izin', (baris) => petakt1(baris)],
        ]);
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`nama` AS `t0__nama`, t0.`syarat_profesi` AS `t0__syarat_profesi`, t0.`aktif` AS `t0__aktif`, t0.`diubah_oleh` AS `t0__diubah_oleh`, t0.`alasan_perubahan` AS `t0__alasan_perubahan`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t1.`id` AS `t1__id`, t1.`jenis_akun_id` AS `t1__jenis_akun_id`, t1.`izin_id` AS `t1__izin_id`, t1.`dibuat_oleh` AS `t1__dibuat_oleh`, t1.`dibuat_pada` AS `t1__dibuat_pada`, t2.`id` AS `t2__id`, t2.`fitur` AS `t2__fitur`, t2.`aksi` AS `t2__aksi`, t2.`cakupan` AS `t2__cakupan`, t2.`dibuat_oleh` AS `t2__dibuat_oleh`, t2.`dibuat_pada` AS `t2__dibuat_pada`\nFROM (SELECT t0.* FROM `jenis_akun` t0 WHERE ((? OR t0.`id` <=> ?)) LIMIT 1) t0\nLEFT JOIN (SELECT b1.* FROM `izin_jenis_akun` b1 WHERE TRUE) t1 ON t0.`id` = t1.`jenis_akun_id`\nLEFT JOIN (SELECT b2.* FROM `izin` b2 WHERE TRUE) t2 ON t1.`izin_id` = t2.`id`\nORDER BY t1.`id` ASC, t2.`id` ASC", [id === undefined, id ?? null], koneksi);
    const hasil = petakt0(baris);
    return (hasil[0] ?? null);
}
export async function tambahJenisAkunUntukBuatJenisAkun(nama, syarat_profesi, diubah_oleh, alasan_perubahan, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `jenis_akun` (`nama`, `syarat_profesi`, `diubah_oleh`, `alasan_perubahan`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?)", [(nama === undefined ? null : nama) ?? null, (syarat_profesi === undefined ? null : syarat_profesi) ?? null, (diubah_oleh === undefined ? null : diubah_oleh) ?? null, (alasan_perubahan === undefined ? null : alasan_perubahan) ?? null, (diubah_oleh === undefined ? null : diubah_oleh) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function tambahJenisAkunUntukBuatJenisAkunHasil(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`nama`, t.`syarat_profesi`, t.`aktif`, t.`diubah_oleh`, t.`alasan_perubahan`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `jenis_akun` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    if (!baris[0])
        throw new Error('Baris jenis_akun tidak ditemukan.');
    return baris[0];
}
export async function ubahJenisAkunUntukUbahJenisAkun(nama, syarat_profesi, aktif, diubah_oleh, alasan_perubahan, id, koneksi = pool) {
    const hasil = await tulis("UPDATE `jenis_akun` t SET `nama` = IF(?, t.`nama`, ?), `syarat_profesi` = IF(?, t.`syarat_profesi`, ?), `aktif` = IF(?, t.`aktif`, ?), `diubah_oleh` = IF(?, t.`diubah_oleh`, ?), `alasan_perubahan` = IF(?, t.`alasan_perubahan`, ?) WHERE ((? OR t.`id` <=> ?))", [nama === undefined, nama ?? null, syarat_profesi === undefined, syarat_profesi ?? null, aktif === undefined, aktif ?? null, diubah_oleh === undefined, diubah_oleh ?? null, alasan_perubahan === undefined, alasan_perubahan ?? null, id === undefined, id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function simpanJenisAkunUntukJalankanSeed(nama, syarat_profesi, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `jenis_akun` (`nama`, `syarat_profesi`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `id` = `id`, `id` = LAST_INSERT_ID(`id`)", [(nama === undefined ? null : nama) ?? null, (syarat_profesi === undefined ? null : syarat_profesi) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function simpanJenisAkunUntukJalankanSeedHasil(nama, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`nama`, t.`syarat_profesi`, t.`aktif`, t.`diubah_oleh`, t.`alasan_perubahan`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `jenis_akun` t WHERE (((? OR t.`nama` <=> ?))) LIMIT 1", [nama === undefined, nama ?? null], koneksi);
    if (!baris[0])
        throw new Error('Baris jenis_akun tidak ditemukan.');
    return baris[0];
}
