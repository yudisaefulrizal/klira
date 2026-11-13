import { baca, tulis, pool } from '../../koneksi.js';
export async function tambahBanyakKodeTerminologiUntukKlinisKlinisIntegrasiTest(data, koneksi = pool) {
    if (!data.length)
        return { count: 0 };
    const nilai = data.map(d => [((d.sistem === undefined ? null : d.sistem) ?? null), (d.kode === undefined ? null : d.kode) ?? null, (d.nama === undefined ? null : d.nama) ?? null, (d.aktif === undefined ? true : d.aktif) ?? null, (d.contoh === undefined ? false : d.contoh) ?? null]);
    const hasil = await tulis("INSERT INTO `kode_terminologi` (`sistem`, `kode`, `nama`, `aktif`, `contoh`) VALUES ?", [nilai], koneksi);
    return { count: hasil.affectedRows };
}
export async function hapusKodeTerminologiUntukKlinisKlinisIntegrasiTest(kode, koneksi = pool) {
    const hasil = await tulis("DELETE t FROM `kode_terminologi` t WHERE ((? OR t.`kode` LIKE ? ESCAPE '!'))", [kode === undefined, String(kode ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%'], koneksi);
    return { count: hasil.affectedRows };
}
export async function hapusKodeTerminologiUntukSeedTerminologiTest(kode, koneksi = pool) {
    const hasil = await tulis("DELETE t FROM `kode_terminologi` t WHERE ((? OR t.`kode` IN (?)))", [kode === undefined, (kode)?.length ? (kode) : [null]], koneksi);
    return { count: hasil.affectedRows };
}
export async function daftarKodeTerminologiUntukSeedTerminologiTest(sistem, kode, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`sistem`, t.`kode`, t.`nama`, t.`aktif`, t.`contoh` FROM `kode_terminologi` t WHERE ((? OR t.`sistem` <=> ?)) AND ((? OR t.`kode` <=> ?))", [sistem === undefined, sistem ?? null, kode === undefined, kode ?? null], koneksi);
    return baris;
}
export async function wajibKodeTerminologiUntukSeedTerminologiTest(sistem, kode, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`sistem`, t.`kode`, t.`nama`, t.`aktif`, t.`contoh` FROM `kode_terminologi` t WHERE ((? OR t.`sistem` <=> ?)) AND ((? OR t.`kode` <=> ?)) LIMIT 1", [sistem === undefined, sistem ?? null, kode === undefined, kode ?? null], koneksi);
    if (!baris[0])
        throw new Error('Baris kode_terminologi tidak ditemukan.');
    return baris[0];
}
