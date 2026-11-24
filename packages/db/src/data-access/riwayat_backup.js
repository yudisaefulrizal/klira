import { baca, tulis, pool } from '../koneksi.js';
export async function hitungRiwayatBackupUntukDaftarBackup(koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `riwayat_backup` t WHERE TRUE", [], koneksi);
    return Number(baris.jumlah);
}
export async function daftarRiwayatBackupUntukDaftarBackup(batas, lewati, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`waktu`, t.`status`, t.`ukuran_byte`, t.`lokasi` FROM `riwayat_backup` t WHERE TRUE ORDER BY t.`waktu` DESC, t.`id` DESC LIMIT ? OFFSET ?", [batas ?? 2147483647, lewati ?? 0], koneksi);
    for (const b of baris)
        if (b.ukuran_byte !== null)
            b.ukuran_byte = BigInt(b.ukuran_byte);
    return baris;
}
/** Catat operasi cadangan (unduh, pulihkan, reset); `lokasi` menerangkan operasi dan asalnya. Mengembalikan id baris. */
export async function tambahRiwayatBackup(status, lokasi, dibuat_oleh, ukuran_byte, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `riwayat_backup` (`status`, `lokasi`, `dibuat_oleh`, `ukuran_byte`) VALUES (?, ?, ?, ?)", [status, lokasi, dibuat_oleh ?? null, ukuran_byte ?? null], koneksi);
    return hasil.insertId;
}
export async function ubahStatusRiwayatBackup(id, status, ukuran_byte, koneksi = pool) {
    await tulis("UPDATE `riwayat_backup` SET `status` = ?, `ukuran_byte` = ? WHERE `id` = ?", [status, ukuran_byte ?? null, id], koneksi);
}
