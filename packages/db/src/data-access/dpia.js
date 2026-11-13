import { baca, tulis, pool } from '../koneksi.js';
export async function hitungDpiaUntukRingkasan(fasyankes_id, tinjau_ulang_pada, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `dpia` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`tinjau_ulang_pada` < ?))", [fasyankes_id === undefined, fasyankes_id ?? null, tinjau_ulang_pada === undefined, tinjau_ulang_pada ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function hitungDpiaUntukDaftarDpia(fasyankes_id, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `dpia` t WHERE ((? OR t.`fasyankes_id` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function daftarDpiaUntukDaftarDpia(fasyankes_id, batas, lewati, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`pemrosesan`, t.`ropa_id`, t.`risiko`, t.`mitigasi`, t.`saran_ppdp`, t.`tinjau_ulang_pada`, t.`ditinjau_pada`, t.`dibuat_oleh`, t.`dibuat_pada`, t.`diperbarui_pada` FROM `dpia` t WHERE ((? OR t.`fasyankes_id` <=> ?)) ORDER BY t.`tinjau_ulang_pada` ASC LIMIT ? OFFSET ?", [fasyankes_id === undefined, fasyankes_id ?? null, batas ?? 2147483647, lewati ?? 0], koneksi);
    return baris;
}
export async function cariDpiaUntukDpia(id, fasyankes_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`pemrosesan`, t.`ropa_id`, t.`risiko`, t.`mitigasi`, t.`saran_ppdp`, t.`tinjau_ulang_pada`, t.`ditinjau_pada`, t.`dibuat_oleh`, t.`dibuat_pada`, t.`diperbarui_pada` FROM `dpia` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) LIMIT 1", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function tambahDpiaUntukBuatDpia(fasyankes_id, pemrosesan, ropa_id, risiko, mitigasi, saran_ppdp, tinjau_ulang_pada, ditinjau_pada, dibuat_oleh, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `dpia` (`fasyankes_id`, `pemrosesan`, `ropa_id`, `risiko`, `mitigasi`, `saran_ppdp`, `tinjau_ulang_pada`, `ditinjau_pada`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (pemrosesan === undefined ? null : pemrosesan) ?? null, (ropa_id === undefined ? null : ropa_id) ?? null, (risiko === undefined ? null : risiko) ?? null, (mitigasi === undefined ? null : mitigasi) ?? null, (saran_ppdp === undefined ? null : saran_ppdp) ?? null, (tinjau_ulang_pada === undefined ? null : tinjau_ulang_pada) ?? null, (ditinjau_pada === undefined ? null : ditinjau_pada) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function tambahDpiaUntukBuatDpiaHasil(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`pemrosesan`, t.`ropa_id`, t.`risiko`, t.`mitigasi`, t.`saran_ppdp`, t.`tinjau_ulang_pada`, t.`ditinjau_pada`, t.`dibuat_oleh`, t.`dibuat_pada`, t.`diperbarui_pada` FROM `dpia` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    if (!baris[0])
        throw new Error('Baris dpia tidak ditemukan.');
    return baris[0];
}
export async function ubahDpiaUntukUbahDpia(pemrosesan, ropa_id, risiko, mitigasi, saran_ppdp, tinjau_ulang_pada, ditinjau_pada, diperbarui_pada, id, fasyankes_id, koneksi = pool) {
    const hasil = await tulis("UPDATE `dpia` t SET `pemrosesan` = IF(?, t.`pemrosesan`, ?), `ropa_id` = IF(?, t.`ropa_id`, ?), `risiko` = IF(?, t.`risiko`, ?), `mitigasi` = IF(?, t.`mitigasi`, ?), `saran_ppdp` = IF(?, t.`saran_ppdp`, ?), `tinjau_ulang_pada` = IF(?, t.`tinjau_ulang_pada`, ?), `ditinjau_pada` = IF(?, t.`ditinjau_pada`, ?), `diperbarui_pada` = IF(?, t.`diperbarui_pada`, ?) WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?))", [pemrosesan === undefined, pemrosesan ?? null, ropa_id === undefined, ropa_id ?? null, risiko === undefined, risiko ?? null, mitigasi === undefined, mitigasi ?? null, saran_ppdp === undefined, saran_ppdp ?? null, tinjau_ulang_pada === undefined, tinjau_ulang_pada ?? null, ditinjau_pada === undefined, ditinjau_pada ?? null, diperbarui_pada === undefined, diperbarui_pada ?? null, id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
