import { baca, tulis, pool } from '../koneksi.js';
import { kelompokkan } from '../pemeta.js';
import { wajibId } from '../wajib.js';
export async function hitungProfilProfesiUntukDaftar(aktif, nama, nomor_sip, pakai, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `profil_profesi` t WHERE ((? OR t.`aktif` <=> ?)) AND ((? OR (((EXISTS (SELECT 1 FROM `pengguna` r1 WHERE t.`pengguna_id` = r1.`id` AND (((? OR r1.`nama` LIKE ? ESCAPE '!')))))) OR (((? OR t.`profesi` LIKE ? ESCAPE '!'))) OR (((? OR t.`nomor_sip` LIKE ? ESCAPE '!'))))))", [aktif === undefined, aktif ?? null, !pakai, nama === undefined, '%' + String(nama ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', nama === undefined, '%' + String(nama ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', nomor_sip === undefined, '%' + String(nomor_sip ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%'], koneksi);
    return Number(baris.jumlah);
}
export async function daftarProfilProfesiUntukDaftar(aktif, nama, nomor_sip, pakai, batas, lewati, koneksi = pool) {
    function petakt1(semua) {
        return kelompokkan(semua, 't1', [
            'nama',
        ]);
    }
    function petakt0(semua) {
        return kelompokkan(semua, 't0', [
            'id', 'pengguna_id', 'profesi', 'nomor_sip', 'masa_berlaku_sip', 'ihs_practitioner_id', 'aktif',
            'dibuat_oleh', 'dibuat_pada',
            ['pengguna', (baris) => petakt1(baris)[0]],
        ]);
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`pengguna_id` AS `t0__pengguna_id`, t0.`profesi` AS `t0__profesi`, t0.`nomor_sip` AS `t0__nomor_sip`, t0.`masa_berlaku_sip` AS `t0__masa_berlaku_sip`, t0.`ihs_practitioner_id` AS `t0__ihs_practitioner_id`, t0.`aktif` AS `t0__aktif`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t1.`id` AS `t1__id`, t1.`nama` AS `t1__nama`\nFROM (SELECT t0.* FROM `profil_profesi` t0 WHERE ((? OR t0.`aktif` <=> ?)) AND ((? OR (((EXISTS (SELECT 1 FROM `pengguna` r1 WHERE t0.`pengguna_id` = r1.`id` AND (((? OR r1.`nama` LIKE ? ESCAPE '!')))))) OR (((? OR t0.`profesi` LIKE ? ESCAPE '!'))) OR (((? OR t0.`nomor_sip` LIKE ? ESCAPE '!')))))) ORDER BY (SELECT o2.`nama` FROM `pengguna` o2 WHERE t0.`pengguna_id` = o2.`id` LIMIT 1) ASC, t0.`id` ASC LIMIT ? OFFSET ?) t0\nLEFT JOIN (SELECT b1.* FROM `pengguna` b1 WHERE TRUE) t1 ON t0.`pengguna_id` = t1.`id`\nORDER BY (SELECT o2.`nama` FROM `pengguna` o2 WHERE t0.`pengguna_id` = o2.`id` LIMIT 1) ASC, t0.`id` ASC, t1.`id` ASC", [aktif === undefined, aktif ?? null, !pakai, nama === undefined, '%' + String(nama ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', nama === undefined, '%' + String(nama ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', nomor_sip === undefined, '%' + String(nomor_sip ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%', batas ?? 2147483647, lewati ?? 0], koneksi);
    const hasil = petakt0(baris);
    return hasil;
}
export async function cariProfilProfesiUntukAmbil(id, koneksi = pool) {
    function petakt1(semua) {
        return kelompokkan(semua, 't1', [
            'nama',
        ]);
    }
    function petakt0(semua) {
        return kelompokkan(semua, 't0', [
            'id', 'pengguna_id', 'profesi', 'nomor_sip', 'masa_berlaku_sip', 'ihs_practitioner_id', 'aktif',
            'dibuat_oleh', 'dibuat_pada',
            ['pengguna', (baris) => petakt1(baris)[0]],
        ]);
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`pengguna_id` AS `t0__pengguna_id`, t0.`profesi` AS `t0__profesi`, t0.`nomor_sip` AS `t0__nomor_sip`, t0.`masa_berlaku_sip` AS `t0__masa_berlaku_sip`, t0.`ihs_practitioner_id` AS `t0__ihs_practitioner_id`, t0.`aktif` AS `t0__aktif`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t1.`id` AS `t1__id`, t1.`nama` AS `t1__nama`\nFROM (SELECT t0.* FROM `profil_profesi` t0 WHERE ((? OR t0.`id` <=> ?)) LIMIT 1) t0\nLEFT JOIN (SELECT b1.* FROM `pengguna` b1 WHERE TRUE) t1 ON t0.`pengguna_id` = t1.`id`\nORDER BY t1.`id` ASC", [id === undefined, id ?? null], koneksi);
    const hasil = petakt0(baris);
    return (hasil[0] ?? null);
}
export async function tambahProfilProfesiUntukBuat(pengguna_id, profesi, nomor_sip, masa_berlaku_sip, ihs_practitioner_id, dibuat_oleh, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `profil_profesi` (`pengguna_id`, `profesi`, `nomor_sip`, `masa_berlaku_sip`, `ihs_practitioner_id`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?)", [(pengguna_id === undefined ? null : pengguna_id) ?? null, (profesi === undefined ? null : profesi) ?? null, (nomor_sip === undefined ? null : nomor_sip) ?? null, (masa_berlaku_sip === undefined ? null : masa_berlaku_sip) ?? null, (ihs_practitioner_id === undefined ? null : ihs_practitioner_id) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function tambahProfilProfesiUntukBuatHasil(id, koneksi = pool) {
    function petakt1(semua) {
        return kelompokkan(semua, 't1', [
            'nama',
        ]);
    }
    function petakt0(semua) {
        return kelompokkan(semua, 't0', [
            'id', 'pengguna_id', 'profesi', 'nomor_sip', 'masa_berlaku_sip', 'ihs_practitioner_id', 'aktif',
            'dibuat_oleh', 'dibuat_pada',
            ['pengguna', (baris) => petakt1(baris)[0]],
        ]);
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`pengguna_id` AS `t0__pengguna_id`, t0.`profesi` AS `t0__profesi`, t0.`nomor_sip` AS `t0__nomor_sip`, t0.`masa_berlaku_sip` AS `t0__masa_berlaku_sip`, t0.`ihs_practitioner_id` AS `t0__ihs_practitioner_id`, t0.`aktif` AS `t0__aktif`, t0.`dibuat_oleh` AS `t0__dibuat_oleh`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t1.`id` AS `t1__id`, t1.`nama` AS `t1__nama`\nFROM (SELECT t0.* FROM `profil_profesi` t0 WHERE ((? OR t0.`id` <=> ?)) LIMIT 1) t0\nLEFT JOIN (SELECT b1.* FROM `pengguna` b1 WHERE TRUE) t1 ON t0.`pengguna_id` = t1.`id`\nORDER BY t1.`id` ASC", [id === undefined, id ?? null], koneksi);
    const hasil = petakt0(baris);
    if (!hasil[0])
        throw new Error('Baris profil_profesi tidak ditemukan.');
    return hasil[0];
}
export async function ubahProfilProfesiUntukUbah(profesi, nomor_sip, masa_berlaku_sip, ihs_practitioner_id, id, koneksi = pool) {
    wajibId('ubahProfilProfesiUntukUbah', id);
    const hasil = await tulis("UPDATE `profil_profesi` t SET `profesi` = IF(?, t.`profesi`, ?), `nomor_sip` = IF(?, t.`nomor_sip`, ?), `masa_berlaku_sip` = IF(?, t.`masa_berlaku_sip`, ?), `ihs_practitioner_id` = IF(?, t.`ihs_practitioner_id`, ?) WHERE ((? OR t.`id` <=> ?))", [profesi === undefined, profesi ?? null, nomor_sip === undefined, nomor_sip ?? null, masa_berlaku_sip === undefined, masa_berlaku_sip ?? null, ihs_practitioner_id === undefined, ihs_practitioner_id ?? null, id === undefined, id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function ubahProfilProfesiUntukSetAktif(aktif, id, koneksi = pool) {
    wajibId('ubahProfilProfesiUntukSetAktif', id);
    const hasil = await tulis("UPDATE `profil_profesi` t SET `aktif` = IF(?, t.`aktif`, ?) WHERE ((? OR t.`id` <=> ?))", [aktif === undefined, aktif ?? null, id === undefined, id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function hitungProfilProfesiUntukPunyaProfil(pengguna_id, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `profil_profesi` t WHERE ((? OR t.`pengguna_id` <=> ?))", [pengguna_id === undefined, pengguna_id ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function hitungProfilProfesiUntukHitungKesiapan(aktif, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `profil_profesi` t WHERE ((? OR t.`aktif` <=> ?))", [aktif === undefined, aktif ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function hitungProfilProfesiUntukHitungKesiapan2(aktif, masa_berlaku_sip, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `profil_profesi` t WHERE ((? OR t.`aktif` <=> ?)) AND ((? OR t.`masa_berlaku_sip` < ?))", [aktif === undefined, aktif ?? null, masa_berlaku_sip === undefined, masa_berlaku_sip ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function tambahProfilProfesiUntukBuatAkunHasil(id, koneksi = pool) {
    wajibId('tambahProfilProfesiUntukBuatAkunHasil', id);
    const baris = await baca("SELECT t.`id`, t.`pengguna_id`, t.`profesi`, t.`nomor_sip`, t.`masa_berlaku_sip`, t.`ihs_practitioner_id`, t.`aktif`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `profil_profesi` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    if (!baris[0])
        throw new Error('Baris profil_profesi tidak ditemukan.');
    return baris[0];
}
export async function tambahProfilDemo(penggunaId, profesi, sip, berlaku, koneksi = pool) {
    await tulis('INSERT INTO profil_profesi (pengguna_id, profesi, nomor_sip, masa_berlaku_sip) VALUES (?, ?, ?, ?)', [penggunaId, profesi, sip, berlaku], koneksi);
}
