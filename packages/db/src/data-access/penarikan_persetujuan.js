import { baca, tulis, pool } from '../koneksi.js';
export async function daftarPenarikanPersetujuanUntukDaftarPersetujuan(persetujuan_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`persetujuan_id`, t.`alasan`, t.`waktu`, t.`batas_henti`, t.`dicatat_oleh` FROM `penarikan_persetujuan` t WHERE ((? OR t.`persetujuan_id` IN (?)))", [persetujuan_id === undefined, (persetujuan_id)?.length ? (persetujuan_id) : [null]], koneksi);
    return baris;
}
export async function tambahPenarikanPersetujuanUntukTarik(persetujuan_id, alasan, waktu, batas_henti, dicatat_oleh, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `penarikan_persetujuan` (`persetujuan_id`, `alasan`, `waktu`, `batas_henti`, `dicatat_oleh`) VALUES (?, ?, ?, ?, ?)", [(persetujuan_id === undefined ? null : persetujuan_id) ?? null, (alasan === undefined ? null : alasan) ?? null, (waktu === undefined ? new Date() : waktu) ?? null, (batas_henti === undefined ? null : batas_henti) ?? null, (dicatat_oleh === undefined ? null : dicatat_oleh) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
