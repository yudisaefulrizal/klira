import { baca, tulis, pool } from '../koneksi.js';
import { wajibId } from '../wajib.js';
export async function cariTeksPersetujuanUntukTeksAktif(jenis, aktif, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`jenis`, t.`versi`, t.`judul`, t.`tujuan`, t.`isi` FROM `teks_persetujuan` t WHERE ((? OR t.`jenis` <=> ?)) AND ((? OR t.`aktif` <=> ?)) ORDER BY t.`versi` DESC LIMIT 1", [jenis === undefined, jenis ?? null, aktif === undefined, aktif ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function cariTeksPersetujuanUntukTeksUntukPakai(id, jenis, aktif, koneksi = pool) {
    wajibId('cariTeksPersetujuanUntukTeksUntukPakai', id);
    const baris = await baca("SELECT t.`id`, t.`jenis`, t.`versi`, t.`judul`, t.`tujuan`, t.`isi` FROM `teks_persetujuan` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`jenis` <=> ?)) AND ((? OR t.`aktif` <=> ?)) AND (TRUE OR TRUE) LIMIT 1", [id === undefined, id ?? null, jenis === undefined, jenis ?? null, aktif === undefined, aktif ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function daftarTeksPersetujuanUntukDaftarTeksPdp(jenis, batas, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`jenis`, t.`versi`, t.`judul`, t.`tujuan`, t.`isi`, t.`aktif`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `teks_persetujuan` t WHERE ((? OR t.`jenis` <=> ?)) ORDER BY t.`versi` DESC LIMIT ? OFFSET ?", [jenis === undefined, jenis ?? null, batas ?? 2147483647, 0], koneksi);
    return baris;
}
export async function ringkasanTeksPersetujuanUntukBuatTeksPdp(jenis, koneksi = pool) {
    const baris = await baca("SELECT MAX(t.`versi`) AS `_max_versi` FROM `teks_persetujuan` t WHERE ((? OR t.`jenis` <=> ?))", [jenis === undefined, jenis ?? null], koneksi);
    const hasil = baris.map(b => ({ _max: { versi: b._max_versi } }));
    return hasil[0];
}
export async function ubahTeksPersetujuanUntukBuatTeksPdp(aktif, jenis, aktif2, koneksi = pool) {
    const hasil = await tulis("UPDATE `teks_persetujuan` t SET `aktif` = IF(?, t.`aktif`, ?) WHERE ((? OR t.`jenis` <=> ?)) AND ((? OR t.`aktif` <=> ?))", [aktif === undefined, aktif ?? null, jenis === undefined, jenis ?? null, aktif2 === undefined, aktif2 ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function tambahTeksPersetujuanUntukBuatTeksPdp(jenis, versi, judul, tujuan, isi, aktif, dibuat_oleh, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `teks_persetujuan` (`jenis`, `versi`, `judul`, `tujuan`, `isi`, `aktif`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?, ?)", [((jenis === undefined ? null : jenis) ?? null), (versi === undefined ? null : versi) ?? null, (judul === undefined ? null : judul) ?? null, (tujuan === undefined ? null : tujuan) ?? null, (isi === undefined ? null : isi) ?? null, (aktif === undefined ? true : aktif) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function tambahTeksPersetujuanUntukBuatTeksPdpHasil(id, koneksi = pool) {
    wajibId('tambahTeksPersetujuanUntukBuatTeksPdpHasil', id);
    const baris = await baca("SELECT t.`id`, t.`jenis`, t.`versi`, t.`judul`, t.`tujuan`, t.`isi`, t.`aktif`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `teks_persetujuan` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    if (!baris[0])
        throw new Error('Baris teks_persetujuan tidak ditemukan.');
    return baris[0];
}
export async function cariTeksPersetujuanUntukSeedTeksPersetujuan(jenis, versi, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`jenis`, t.`versi`, t.`judul`, t.`tujuan`, t.`isi`, t.`aktif`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `teks_persetujuan` t WHERE ((? OR t.`jenis` <=> ?)) AND ((? OR t.`versi` <=> ?)) LIMIT 1", [jenis === undefined, jenis ?? null, versi === undefined, versi ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function tambahTeksPersetujuanUntukSeedTeksPersetujuan(jenis, versi, judul, tujuan, isi, aktif, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `teks_persetujuan` (`jenis`, `versi`, `judul`, `tujuan`, `isi`, `aktif`) VALUES (?, ?, ?, ?, ?, ?)", [((jenis === undefined ? null : jenis) ?? null), (versi === undefined ? null : versi) ?? null, (judul === undefined ? null : judul) ?? null, (tujuan === undefined ? null : tujuan) ?? null, (isi === undefined ? null : isi) ?? null, (aktif === undefined ? true : aktif) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
