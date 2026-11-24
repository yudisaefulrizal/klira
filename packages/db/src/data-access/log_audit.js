import { baca, tulis, pool } from '../koneksi.js';
export async function tambahLogAuditUntukTambah(pengguna_id, aksi, entitas, entitas_id, keterangan, waktu, alamat, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `log_audit` (`pengguna_id`, `aksi`, `entitas`, `entitas_id`, `keterangan`, `waktu`, `alamat`) VALUES (?, ?, ?, ?, ?, ?, ?)", [(pengguna_id === undefined ? null : pengguna_id) ?? null, (aksi === undefined ? null : aksi) ?? null, (entitas === undefined ? null : entitas) ?? null, (entitas_id === undefined ? null : entitas_id) ?? null, (keterangan === undefined ? null : keterangan) ?? null, (waktu === undefined ? new Date() : waktu) ?? null, (alamat === undefined ? null : alamat) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function hitungLogAuditUntukCari(pengguna_id, aksi, entitas, waktu, waktu2, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `log_audit` t WHERE ((? OR t.`pengguna_id` <=> ?)) AND ((? OR t.`aksi` <=> ?)) AND ((? OR t.`entitas` <=> ?)) AND ((? OR t.`waktu` >= ?) AND (? OR t.`waktu` <= ?))", [pengguna_id === undefined, pengguna_id ?? null, aksi === undefined, aksi ?? null, entitas === undefined, entitas ?? null, waktu === undefined, waktu ?? null, waktu2 === undefined, waktu2 ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function daftarLogAuditUntukCari(pengguna_id, aksi, entitas, waktu, waktu2, batas, lewati, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`pengguna_id`, t.`aksi`, t.`entitas`, t.`entitas_id`, t.`keterangan`, t.`waktu`, t.`alamat` FROM `log_audit` t WHERE ((? OR t.`pengguna_id` <=> ?)) AND ((? OR t.`aksi` <=> ?)) AND ((? OR t.`entitas` <=> ?)) AND ((? OR t.`waktu` >= ?) AND (? OR t.`waktu` <= ?)) ORDER BY t.`waktu` DESC, t.`id` DESC LIMIT ? OFFSET ?", [pengguna_id === undefined, pengguna_id ?? null, aksi === undefined, aksi ?? null, entitas === undefined, entitas ?? null, waktu === undefined, waktu ?? null, waktu2 === undefined, waktu2 ?? null, batas ?? 2147483647, lewati ?? 0], koneksi);
    return baris;
}
export async function cariLogAuditUntukAmbil(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`pengguna_id`, t.`aksi`, t.`entitas`, t.`entitas_id`, t.`keterangan`, t.`waktu`, t.`alamat` FROM `log_audit` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function tambahLogAuditUntukSeedPimpinanPertama(pengguna_id, aksi, entitas, keterangan, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `log_audit` (`pengguna_id`, `aksi`, `entitas`, `entitas_id`, `keterangan`) VALUES (?, ?, ?, ?, ?)", [(pengguna_id === undefined ? null : pengguna_id) ?? null, (aksi === undefined ? null : aksi) ?? null, (entitas === undefined ? null : entitas) ?? null, (pengguna_id === undefined ? null : pengguna_id) ?? null, (keterangan === undefined ? null : keterangan) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
