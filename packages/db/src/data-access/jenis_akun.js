import { baca, tulis, pool } from '../koneksi.js';
export async function daftarJenisAkunUntukDaftarJenisAkun(fasyankes_id, koneksi = pool) {
    function petakt2(semua) {
        const grup = new Map();
        for (const baris of semua) {
            if (baris.t2__id === null)
                continue;
            const kunci = String(baris.t2__id);
            const isi = grup.get(kunci);
            if (isi)
                isi.push(baris);
            else
                grup.set(kunci, [baris]);
        }
        return [...grup.values()].map(baris => ({ id: baris[0].t2__id, fasyankes_id: baris[0].t2__fasyankes_id, fitur: baris[0].t2__fitur, aksi: baris[0].t2__aksi, cakupan: baris[0].t2__cakupan, dibuat_oleh: baris[0].t2__dibuat_oleh, dibuat_pada: baris[0].t2__dibuat_pada }));
    }
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
        return [...grup.values()].map(baris => ({ id: baris[0].t1__id, fasyankes_id: baris[0].t1__fasyankes_id, jenis_akun_id: baris[0].t1__jenis_akun_id, izin_id: baris[0].t1__izin_id, dibuat_oleh: baris[0].t1__dibuat_oleh, dibuat_pada: baris[0].t1__dibuat_pada, izin: petakt2(baris)[0] }));
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
        return [...grup.values()].map(baris => ({ id: baris[0].t0__id, fasyankes_id: baris[0].t0__fasyankes_id, nama: baris[0].t0__nama, syarat_profesi: baris[0].t0__syarat_profesi, aktif: baris[0].t0__aktif, diubah_oleh: baris[0].t0__diubah_oleh, alasan_perubahan: baris[0].t0__alasan_perubahan, dibuat_oleh: baris[0].t0__dibuat_oleh, dibuat_pada: baris[0].t0__dibuat_pada, izin: petakt1(baris) }));
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`fasyankes_id` AS `t0__fasyankes_id`, t0.`nama` AS `t0__nama`, t0.`syarat_profesi` AS `t0__syarat_profesi`, t0.`aktif` AS `t0__aktif`, t0.`diubah_oleh` AS `t0__diubah_oleh`, t0.`alasan_perubahan` AS `t0__alasan_perubahan`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t1.`id` AS `t1__id`, t1.`fasyankes_id` AS `t1__fasyankes_id`, t1.`jenis_akun_id` AS `t1__jenis_akun_id`, t1.`izin_id` AS `t1__izin_id`, t1.`dibuat_oleh` AS `t1__dibuat_oleh`, t1.`dibuat_pada` AS `t1__dibuat_pada`, t2.`id` AS `t2__id`, t2.`fasyankes_id` AS `t2__fasyankes_id`, t2.`fitur` AS `t2__fitur`, t2.`aksi` AS `t2__aksi`, t2.`cakupan` AS `t2__cakupan`, t2.`dibuat_oleh` AS `t2__dibuat_oleh`, t2.`dibuat_pada` AS `t2__dibuat_pada`\nFROM (SELECT t0.* FROM `jenis_akun` t0 WHERE ((? OR t0.`fasyankes_id` <=> ?)) ORDER BY t0.`id` ASC) t0\nLEFT JOIN (SELECT b1.* FROM `izin_jenis_akun` b1 WHERE TRUE) t1 ON t0.`id` = t1.`jenis_akun_id`\nLEFT JOIN (SELECT b2.* FROM `izin` b2 WHERE TRUE) t2 ON t1.`izin_id` = t2.`id`\nORDER BY t0.`id` ASC, t1.`id` ASC, t2.`id` ASC", [fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    const hasil = petakt0(baris);
    return hasil;
}
export async function cariJenisAkunUntukAmbilJenisAkun(id, fasyankes_id, koneksi = pool) {
    function petakt2(semua) {
        const grup = new Map();
        for (const baris of semua) {
            if (baris.t2__id === null)
                continue;
            const kunci = String(baris.t2__id);
            const isi = grup.get(kunci);
            if (isi)
                isi.push(baris);
            else
                grup.set(kunci, [baris]);
        }
        return [...grup.values()].map(baris => ({ id: baris[0].t2__id, fasyankes_id: baris[0].t2__fasyankes_id, fitur: baris[0].t2__fitur, aksi: baris[0].t2__aksi, cakupan: baris[0].t2__cakupan, dibuat_oleh: baris[0].t2__dibuat_oleh, dibuat_pada: baris[0].t2__dibuat_pada }));
    }
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
        return [...grup.values()].map(baris => ({ id: baris[0].t1__id, fasyankes_id: baris[0].t1__fasyankes_id, jenis_akun_id: baris[0].t1__jenis_akun_id, izin_id: baris[0].t1__izin_id, dibuat_oleh: baris[0].t1__dibuat_oleh, dibuat_pada: baris[0].t1__dibuat_pada, izin: petakt2(baris)[0] }));
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
        return [...grup.values()].map(baris => ({ id: baris[0].t0__id, fasyankes_id: baris[0].t0__fasyankes_id, nama: baris[0].t0__nama, syarat_profesi: baris[0].t0__syarat_profesi, aktif: baris[0].t0__aktif, diubah_oleh: baris[0].t0__diubah_oleh, alasan_perubahan: baris[0].t0__alasan_perubahan, dibuat_oleh: baris[0].t0__dibuat_oleh, dibuat_pada: baris[0].t0__dibuat_pada, izin: petakt1(baris) }));
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`fasyankes_id` AS `t0__fasyankes_id`, t0.`nama` AS `t0__nama`, t0.`syarat_profesi` AS `t0__syarat_profesi`, t0.`aktif` AS `t0__aktif`, t0.`diubah_oleh` AS `t0__diubah_oleh`, t0.`alasan_perubahan` AS `t0__alasan_perubahan`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t1.`id` AS `t1__id`, t1.`fasyankes_id` AS `t1__fasyankes_id`, t1.`jenis_akun_id` AS `t1__jenis_akun_id`, t1.`izin_id` AS `t1__izin_id`, t1.`dibuat_oleh` AS `t1__dibuat_oleh`, t1.`dibuat_pada` AS `t1__dibuat_pada`, t2.`id` AS `t2__id`, t2.`fasyankes_id` AS `t2__fasyankes_id`, t2.`fitur` AS `t2__fitur`, t2.`aksi` AS `t2__aksi`, t2.`cakupan` AS `t2__cakupan`, t2.`dibuat_oleh` AS `t2__dibuat_oleh`, t2.`dibuat_pada` AS `t2__dibuat_pada`\nFROM (SELECT t0.* FROM `jenis_akun` t0 WHERE ((? OR t0.`id` <=> ?)) AND ((? OR t0.`fasyankes_id` <=> ?)) LIMIT 1) t0\nLEFT JOIN (SELECT b1.* FROM `izin_jenis_akun` b1 WHERE TRUE) t1 ON t0.`id` = t1.`jenis_akun_id`\nLEFT JOIN (SELECT b2.* FROM `izin` b2 WHERE TRUE) t2 ON t1.`izin_id` = t2.`id`\nORDER BY t1.`id` ASC, t2.`id` ASC", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    const hasil = petakt0(baris);
    return (hasil[0] ?? null);
}
export async function tambahJenisAkunUntukBuatJenisAkun(fasyankes_id, nama, syarat_profesi, diubah_oleh, alasan_perubahan, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `jenis_akun` (`fasyankes_id`, `nama`, `syarat_profesi`, `diubah_oleh`, `alasan_perubahan`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (nama === undefined ? null : nama) ?? null, (syarat_profesi === undefined ? null : syarat_profesi) ?? null, (diubah_oleh === undefined ? null : diubah_oleh) ?? null, (alasan_perubahan === undefined ? null : alasan_perubahan) ?? null, (diubah_oleh === undefined ? null : diubah_oleh) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function tambahJenisAkunUntukBuatJenisAkunHasil(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`nama`, t.`syarat_profesi`, t.`aktif`, t.`diubah_oleh`, t.`alasan_perubahan`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `jenis_akun` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    if (!baris[0])
        throw new Error('Baris jenis_akun tidak ditemukan.');
    return baris[0];
}
export async function ubahJenisAkunUntukUbahJenisAkun(nama, syarat_profesi, aktif, diubah_oleh, alasan_perubahan, id, koneksi = pool) {
    const hasil = await tulis("UPDATE `jenis_akun` t SET `nama` = IF(?, t.`nama`, ?), `syarat_profesi` = IF(?, t.`syarat_profesi`, ?), `aktif` = IF(?, t.`aktif`, ?), `diubah_oleh` = IF(?, t.`diubah_oleh`, ?), `alasan_perubahan` = IF(?, t.`alasan_perubahan`, ?) WHERE ((? OR t.`id` <=> ?))", [nama === undefined, nama ?? null, syarat_profesi === undefined, syarat_profesi ?? null, aktif === undefined, aktif ?? null, diubah_oleh === undefined, diubah_oleh ?? null, alasan_perubahan === undefined, alasan_perubahan ?? null, id === undefined, id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function simpanJenisAkunUntukJalankanSeed(fasyankes_id, nama, syarat_profesi, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `jenis_akun` (`fasyankes_id`, `nama`, `syarat_profesi`) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE `id` = `id`, `id` = LAST_INSERT_ID(`id`)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (nama === undefined ? null : nama) ?? null, (syarat_profesi === undefined ? null : syarat_profesi) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function simpanJenisAkunUntukJalankanSeedHasil(fasyankes_id, nama, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`nama`, t.`syarat_profesi`, t.`aktif`, t.`diubah_oleh`, t.`alasan_perubahan`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `jenis_akun` t WHERE (((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`nama` <=> ?))) LIMIT 1", [fasyankes_id === undefined, fasyankes_id ?? null, nama === undefined, nama ?? null], koneksi);
    if (!baris[0])
        throw new Error('Baris jenis_akun tidak ditemukan.');
    return baris[0];
}
