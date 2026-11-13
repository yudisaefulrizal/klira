import { baca, tulis, pool } from '../koneksi.js';
export async function cariResumeMedisUntukResume(fasyankes_id, kunjungan_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`kunjungan_id`, t.`isi`, t.`dibuat_oleh`, t.`diperbarui_pada`, t.`dibuat_pada` FROM `resume_medis` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`kunjungan_id` <=> ?)) LIMIT 1", [fasyankes_id === undefined, fasyankes_id ?? null, kunjungan_id === undefined, kunjungan_id ?? null], koneksi);
    for (const b of baris)
        if (typeof b.isi === 'string')
            b.isi = JSON.parse(b.isi);
    return (baris[0] ?? null);
}
export async function daftarResumeMedisUntukResumeAda(fasyankes_id, kunjungan_id, koneksi = pool) {
    const baris = await baca("SELECT t.`kunjungan_id` FROM `resume_medis` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`kunjungan_id` IN (?)))", [fasyankes_id === undefined, fasyankes_id ?? null, kunjungan_id === undefined, (kunjungan_id)?.length ? (kunjungan_id) : [null]], koneksi);
    return baris;
}
export async function simpanResumeMedisUntukSimpanResume(fasyankes_id, kunjungan_id, isi, dibuat_oleh, diperbarui_pada, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `resume_medis` (`fasyankes_id`, `kunjungan_id`, `isi`, `dibuat_oleh`) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE `isi` = IF(?, `isi`, ?), `diperbarui_pada` = IF(?, `diperbarui_pada`, ?), `id` = LAST_INSERT_ID(`id`)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (kunjungan_id === undefined ? null : kunjungan_id) ?? null, JSON.stringify((isi === undefined ? null : isi) ?? null), (dibuat_oleh === undefined ? null : dibuat_oleh) ?? null, isi === undefined, JSON.stringify(isi ?? null), diperbarui_pada === undefined, diperbarui_pada ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
