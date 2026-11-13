import { baca, tulis, pool } from '../../koneksi.js';
export async function daftarVersiCatatanUntukKlinisKlinisIntegrasiTest(entitas, entitas_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`entitas`, t.`entitas_id`, t.`versi`, t.`isi_lama`, t.`alasan`, t.`disetujui_oleh`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `versi_catatan` t WHERE ((? OR t.`entitas` <=> ?)) AND ((? OR t.`entitas_id` <=> ?))", [entitas === undefined, entitas ?? null, entitas_id === undefined, entitas_id ?? null], koneksi);
    for (const b of baris)
        if (typeof b.isi_lama === 'string')
            b.isi_lama = JSON.parse(b.isi_lama);
    return baris;
}
export async function wajibVersiCatatanUntukKlinisKlinisIntegrasiTest(entitas, entitas_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`entitas`, t.`entitas_id`, t.`versi`, t.`isi_lama`, t.`alasan`, t.`disetujui_oleh`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `versi_catatan` t WHERE ((? OR t.`entitas` <=> ?)) AND ((? OR t.`entitas_id` <=> ?)) LIMIT 1", [entitas === undefined, entitas ?? null, entitas_id === undefined, entitas_id ?? null], koneksi);
    for (const b of baris)
        if (typeof b.isi_lama === 'string')
            b.isi_lama = JSON.parse(b.isi_lama);
    if (!baris[0])
        throw new Error('Baris versi_catatan tidak ditemukan.');
    return baris[0];
}
export async function cariVersiCatatanUntukKlinisKlinisIntegrasiTest(fasyankes_id, entitas, entitas_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`entitas`, t.`entitas_id`, t.`versi`, t.`isi_lama`, t.`alasan`, t.`disetujui_oleh`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `versi_catatan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`entitas` <=> ?)) AND ((? OR t.`entitas_id` <=> ?)) LIMIT 1", [fasyankes_id === undefined, fasyankes_id ?? null, entitas === undefined, entitas ?? null, entitas_id === undefined, entitas_id ?? null], koneksi);
    for (const b of baris)
        if (typeof b.isi_lama === 'string')
            b.isi_lama = JSON.parse(b.isi_lama);
    return (baris[0] ?? null);
}
export async function hitungVersiCatatanUntukRekamMedisDokumenIntegrasiTest(entitas, entitas_id, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `versi_catatan` t WHERE ((? OR t.`entitas` <=> ?)) AND ((? OR t.`entitas_id` <=> ?))", [entitas === undefined, entitas ?? null, entitas_id === undefined, entitas_id ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function cariVersiCatatanUntukRekamMedisRmIntegrasiTest(entitas, entitas_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`entitas`, t.`entitas_id`, t.`versi`, t.`isi_lama`, t.`alasan`, t.`disetujui_oleh`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `versi_catatan` t WHERE ((? OR t.`entitas` <=> ?)) AND ((? OR t.`entitas_id` <=> ?)) LIMIT 1", [entitas === undefined, entitas ?? null, entitas_id === undefined, entitas_id ?? null], koneksi);
    for (const b of baris)
        if (typeof b.isi_lama === 'string')
            b.isi_lama = JSON.parse(b.isi_lama);
    return (baris[0] ?? null);
}
export function hapusVersiCatatanFasyankesUji(ids, koneksi = pool) {
    return tulis('DELETE FROM `versi_catatan` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
