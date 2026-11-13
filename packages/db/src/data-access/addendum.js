import { baca, tulis, pool } from '../koneksi.js';
export async function ringkasanAddendumUntukTulisAddendumDalam(entitas, entitas_id, koneksi = pool) {
    const baris = await baca("SELECT MAX(t.`versi`) AS `_max_versi` FROM `addendum` t WHERE ((? OR t.`entitas` <=> ?)) AND ((? OR t.`entitas_id` <=> ?))", [entitas === undefined, entitas ?? null, entitas_id === undefined, entitas_id ?? null], koneksi);
    const hasil = baris.map(b => ({ _max: { versi: b._max_versi } }));
    return hasil[0];
}
export async function tambahAddendumUntukTulisAddendumDalam(fasyankes_id, kunjungan_id, entitas, entitas_id, versi, isi, alasan, waktu, dibuat_oleh, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `addendum` (`fasyankes_id`, `kunjungan_id`, `entitas`, `entitas_id`, `versi`, `isi`, `alasan`, `waktu`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (kunjungan_id === undefined ? null : kunjungan_id) ?? null, (entitas === undefined ? null : entitas) ?? null, (entitas_id === undefined ? null : entitas_id) ?? null, (versi === undefined ? null : versi) ?? null, JSON.stringify((isi === undefined ? null : isi) ?? null), (alasan === undefined ? null : alasan) ?? null, (waktu === undefined ? new Date() : waktu) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function tambahAddendumUntukTulisAddendumDalamHasil(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`entitas`, t.`entitas_id`, t.`versi`, t.`isi`, t.`alasan`, t.`waktu`, t.`perlu_kirim_ulang`, t.`dikirim_pada`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `addendum` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    for (const b of baris)
        if (typeof b.isi === 'string')
            b.isi = JSON.parse(b.isi);
    if (!baris[0])
        throw new Error('Baris addendum tidak ditemukan.');
    return baris[0];
}
export async function daftarAddendumUntukDaftar(fasyankes_id, kunjungan_id, batas, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`entitas`, t.`entitas_id`, t.`versi`, t.`isi`, t.`alasan`, t.`waktu`, t.`perlu_kirim_ulang`, t.`dikirim_pada`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `addendum` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`kunjungan_id` <=> ?)) ORDER BY t.`id` ASC LIMIT ? OFFSET ?", [fasyankes_id === undefined, fasyankes_id ?? null, kunjungan_id === undefined, kunjungan_id ?? null, batas ?? 2147483647, 0], koneksi);
    for (const b of baris)
        if (typeof b.isi === 'string')
            b.isi = JSON.parse(b.isi);
    return baris;
}
export async function daftarAddendumUntukUntukEntitas(fasyankes_id, entitas, entitas_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`entitas`, t.`entitas_id`, t.`versi`, t.`isi`, t.`alasan`, t.`waktu`, t.`perlu_kirim_ulang`, t.`dikirim_pada`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `addendum` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`entitas` <=> ?)) AND ((? OR t.`entitas_id` IN (?))) ORDER BY t.`id` ASC", [fasyankes_id === undefined, fasyankes_id ?? null, entitas === undefined, entitas ?? null, entitas_id === undefined, (entitas_id)?.length ? (entitas_id) : [null]], koneksi);
    for (const b of baris)
        if (typeof b.isi === 'string')
            b.isi = JSON.parse(b.isi);
    return baris;
}
export async function cariAddendumUntukIsi(id, fasyankes_id, koneksi = pool) {
    const baris = await baca("SELECT t.`isi` FROM `addendum` t WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`fasyankes_id` <=> ?)) LIMIT 1", [id === undefined, id ?? null, fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    for (const b of baris)
        if (typeof b.isi === 'string')
            b.isi = JSON.parse(b.isi);
    return (baris[0] ?? null);
}
