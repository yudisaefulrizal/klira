import { baca, tulis, pool } from '../koneksi.js';
export async function cariShiftKasirUntukShiftTerbuka(fasyankes_id, kasir_id, tutup, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`kasir_id`, t.`buka`, t.`tutup`, t.`kas_awal`, t.`kas_akhir`, t.`selisih`, t.`alasan_selisih` FROM `shift_kasir` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`kasir_id` <=> ?)) AND ((? OR t.`tutup` <=> ?)) ORDER BY t.`id` DESC LIMIT 1", [fasyankes_id === undefined, fasyankes_id ?? null, kasir_id === undefined, kasir_id ?? null, tutup === undefined, tutup ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function hitungShiftKasirUntukBukaShift(fasyankes_id, kasir_id, tutup, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `shift_kasir` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`kasir_id` <=> ?)) AND ((? OR t.`tutup` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null, kasir_id === undefined, kasir_id ?? null, tutup === undefined, tutup ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function tambahShiftKasirUntukBukaShift(fasyankes_id, kasir_id, kas_awal, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `shift_kasir` (`fasyankes_id`, `kasir_id`, `kas_awal`) VALUES (?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (kasir_id === undefined ? null : kasir_id) ?? null, (kas_awal === undefined ? null : kas_awal) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function tambahShiftKasirUntukBukaShiftHasil(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`kasir_id`, t.`buka`, t.`tutup`, t.`kas_awal`, t.`kas_akhir`, t.`selisih`, t.`alasan_selisih` FROM `shift_kasir` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    if (!baris[0])
        throw new Error('Baris shift_kasir tidak ditemukan.');
    return baris[0];
}
export async function ubahShiftKasirUntukTutupShift(tutup, kas_akhir, selisih, alasan_selisih, id, tutup2, koneksi = pool) {
    const hasil = await tulis("UPDATE `shift_kasir` t SET `tutup` = IF(?, t.`tutup`, ?), `kas_akhir` = IF(?, t.`kas_akhir`, ?), `selisih` = IF(?, t.`selisih`, ?), `alasan_selisih` = IF(?, t.`alasan_selisih`, ?) WHERE ((? OR t.`id` <=> ?)) AND ((? OR t.`tutup` <=> ?))", [tutup === undefined, tutup ?? null, kas_akhir === undefined, kas_akhir ?? null, selisih === undefined, selisih ?? null, alasan_selisih === undefined, alasan_selisih ?? null, id === undefined, id ?? null, tutup2 === undefined, tutup2 ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function daftarShiftKasirUntukRekap(fasyankes_id, buka, buka2, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`kasir_id`, t.`buka`, t.`tutup`, t.`kas_awal`, t.`kas_akhir`, t.`selisih`, t.`alasan_selisih` FROM `shift_kasir` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`buka` >= ?) AND (? OR t.`buka` < ?)) ORDER BY t.`id` ASC", [fasyankes_id === undefined, fasyankes_id ?? null, buka === undefined, buka ?? null, buka2 === undefined, buka2 ?? null], koneksi);
    return baris;
}
