import { baca, tulis, pool } from '../koneksi.js';
export async function tambahIgPenghapusanUntukBuatRuteInstagramPublik(kode, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `ig_penghapusan` (`kode`) VALUES (?)", [(kode === undefined ? null : kode) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function ambilIgPenghapusanUntukBuatRuteInstagramPublik(kode, koneksi = pool) {
    const baris = await baca("SELECT t.`kode`, t.`dibuat_pada` FROM `ig_penghapusan` t WHERE ((? OR t.`kode` <=> ?)) LIMIT 1", [kode === undefined, kode ?? null], koneksi);
    return (baris[0] ?? null);
}
