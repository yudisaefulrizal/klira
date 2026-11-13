import { baca, tulis, pool } from '../koneksi.js';
export async function daftarCatatanHarianUntukDaftarCatatan(fasyankes_id, kunjungan_id, batas, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`subjektif`, t.`objektif`, t.`asesmen`, t.`rencana`, t.`instruksi`, t.`tanda_vital`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `catatan_harian` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`kunjungan_id` <=> ?)) ORDER BY t.`id` DESC LIMIT ? OFFSET ?", [fasyankes_id === undefined, fasyankes_id ?? null, kunjungan_id === undefined, kunjungan_id ?? null, batas ?? 2147483647, 0], koneksi);
    for (const b of baris)
        if (typeof b.tanda_vital === 'string')
            b.tanda_vital = JSON.parse(b.tanda_vital);
    return baris;
}
export async function cariCatatanHarianUntukIsiCatatan(id, fasyankes_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`subjektif`, t.`objektif`, t.`asesmen`, t.`rencana`, t.`instruksi`, t.`tanda_vital`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `catatan_harian` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) LIMIT 1", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    for (const b of baris)
        if (typeof b.tanda_vital === 'string')
            b.tanda_vital = JSON.parse(b.tanda_vital);
    return (baris[0] ?? null);
}
export async function tambahCatatanHarianUntukTambahCatatan(fasyankes_id, kunjungan_id, subjektif, objektif, asesmen, rencana, instruksi, tanda_vital, dibuat_oleh, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `catatan_harian` (`fasyankes_id`, `kunjungan_id`, `subjektif`, `objektif`, `asesmen`, `rencana`, `instruksi`, `tanda_vital`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (kunjungan_id === undefined ? null : kunjungan_id) ?? null, (subjektif === undefined ? null : subjektif) ?? null, (objektif === undefined ? null : objektif) ?? null, (asesmen === undefined ? null : asesmen) ?? null, (rencana === undefined ? null : rencana) ?? null, (instruksi === undefined ? null : instruksi) ?? null, JSON.stringify((tanda_vital === undefined ? null : tanda_vital) ?? null), (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function tambahCatatanHarianUntukTambahCatatanHasil(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`subjektif`, t.`objektif`, t.`asesmen`, t.`rencana`, t.`instruksi`, t.`tanda_vital`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `catatan_harian` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    for (const b of baris)
        if (typeof b.tanda_vital === 'string')
            b.tanda_vital = JSON.parse(b.tanda_vital);
    if (!baris[0])
        throw new Error('Baris catatan_harian tidak ditemukan.');
    return baris[0];
}
