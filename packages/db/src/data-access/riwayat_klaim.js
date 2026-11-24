import { baca, tulis, pool } from '../koneksi.js';
export async function daftarRiwayatKlaimUntukRiwayat(klaim_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`klaim_id`, t.`dari`, t.`ke`, t.`alasan`, t.`oleh`, t.`waktu` FROM `riwayat_klaim` t WHERE ((? OR t.`klaim_id` IN (?))) ORDER BY t.`id` ASC", [klaim_id === undefined, (klaim_id)?.length ? (klaim_id) : [null]], koneksi);
    return baris;
}
export async function tambahRiwayatKlaimUntukBuat(klaim_id, dari, ke, oleh, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `riwayat_klaim` (`klaim_id`, `dari`, `ke`, `oleh`) VALUES (?, ?, ?, ?)", [(klaim_id === undefined ? null : klaim_id) ?? null, ((dari === undefined ? null : dari) ?? null), ((ke === undefined ? null : ke) ?? null), (oleh === undefined ? null : oleh) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function tambahRiwayatKlaimUntukUbahStatus(klaim_id, dari, ke, alasan, oleh, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `riwayat_klaim` (`klaim_id`, `dari`, `ke`, `alasan`, `oleh`) VALUES (?, ?, ?, ?, ?)", [(klaim_id === undefined ? null : klaim_id) ?? null, ((dari === undefined ? null : dari) ?? null), ((ke === undefined ? null : ke) ?? null), (alasan === undefined ? null : alasan) ?? null, (oleh === undefined ? null : oleh) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
