import { baca, tulis, pool } from '../koneksi.js';
export async function tambahVersiCatatanUntukTulisPengesahanDalam(fasyankes_id, entitas, entitas_id, versi, isi_lama, alasan, disetujui_oleh, dibuat_oleh, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `versi_catatan` (`fasyankes_id`, `entitas`, `entitas_id`, `versi`, `isi_lama`, `alasan`, `disetujui_oleh`, `dibuat_oleh`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (entitas === undefined ? null : entitas) ?? null, (entitas_id === undefined ? null : entitas_id) ?? null, (versi === undefined ? null : versi) ?? null, JSON.stringify((isi_lama === undefined ? null : isi_lama) ?? null), (alasan === undefined ? null : alasan) ?? null, (disetujui_oleh === undefined ? null : disetujui_oleh) ?? null, (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function daftarVersiCatatanUntukRiwayatVersi(fasyankes_id, entitas, entitas_id, batas, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`entitas`, t.`entitas_id`, t.`versi`, t.`isi_lama`, t.`alasan`, t.`disetujui_oleh`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `versi_catatan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`entitas` <=> ?)) AND ((? OR t.`entitas_id` <=> ?)) ORDER BY t.`versi` DESC LIMIT ? OFFSET ?", [fasyankes_id === undefined, fasyankes_id ?? null, entitas === undefined, entitas ?? null, entitas_id === undefined, entitas_id ?? null, batas ?? 2147483647, 0], koneksi);
    for (const b of baris)
        if (typeof b.isi_lama === 'string')
            b.isi_lama = JSON.parse(b.isi_lama);
    return baris;
}
export async function ringkasanVersiCatatanUntukTulisAddendumDalam(entitas, entitas_id, koneksi = pool) {
    const baris = await baca("SELECT MAX(t.`versi`) AS `_max_versi` FROM `versi_catatan` t WHERE ((? OR t.`entitas` <=> ?)) AND ((? OR t.`entitas_id` <=> ?))", [entitas === undefined, entitas ?? null, entitas_id === undefined, entitas_id ?? null], koneksi);
    const hasil = baris.map(b => ({ _max: { versi: b._max_versi } }));
    return hasil[0];
}
