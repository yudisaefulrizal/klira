import { baca, tulis, pool } from '../koneksi.js';
export async function daftarInsidenPasienUntukDaftarInsiden(insiden_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`insiden_id`, t.`pasien_id` FROM `insiden_pasien` t WHERE ((? OR t.`insiden_id` IN (?)))", [insiden_id === undefined, (insiden_id)?.length ? (insiden_id) : [null]], koneksi);
    return baris;
}
export async function daftarInsidenPasienUntukPasienInsiden(insiden_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`insiden_id`, t.`pasien_id` FROM `insiden_pasien` t WHERE ((? OR t.`insiden_id` <=> ?))", [insiden_id === undefined, insiden_id ?? null], koneksi);
    return baris;
}
export async function tambahBanyakInsidenPasienUntukBuatInsiden(data, koneksi = pool) {
    if (!data.length)
        return { count: 0 };
    const nilai = data.map(d => [(d.insiden_id === undefined ? null : d.insiden_id) ?? null, (d.pasien_id === undefined ? null : d.pasien_id) ?? null]);
    const hasil = await tulis("INSERT INTO `insiden_pasien` (`insiden_id`, `pasien_id`) VALUES ?", [nilai], koneksi);
    return { count: hasil.affectedRows };
}
export async function daftarInsidenPasienUntukUbahInsiden(insiden_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`insiden_id`, t.`pasien_id` FROM `insiden_pasien` t WHERE ((? OR t.`insiden_id` <=> ?))", [insiden_id === undefined, insiden_id ?? null], koneksi);
    return baris;
}
