import { baca, tulis, pool } from '../../koneksi.js';
export async function hitungPenempatanUntukRawatInapRawatInapIntegrasiTest(lokasi_id, selesai, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `penempatan` t WHERE ((? OR t.`lokasi_id` <=> ?)) AND ((? OR t.`selesai` <=> ?))", [lokasi_id === undefined, lokasi_id ?? null, selesai === undefined, selesai ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function ubahPenempatanUntukRawatInapRawatInapIntegrasiTest(mulai, kunjungan_id, koneksi = pool) {
    const hasil = await tulis("UPDATE `penempatan` t SET `mulai` = IF(?, t.`mulai`, ?) WHERE ((? OR t.`kunjungan_id` <=> ?))", [mulai === undefined, mulai ?? null, kunjungan_id === undefined, kunjungan_id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function hitungPenempatanUntukRawatInapRawatInapIntegrasiTest2(kunjungan_id, selesai, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `penempatan` t WHERE ((? OR t.`kunjungan_id` <=> ?)) AND ((? OR t.`selesai` <=> ?))", [kunjungan_id === undefined, kunjungan_id ?? null, selesai === undefined, selesai ?? null], koneksi);
    return Number(baris.jumlah);
}
export function hapusPenempatanFasyankesUji(ids, koneksi = pool) {
    return tulis('DELETE FROM `penempatan` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
