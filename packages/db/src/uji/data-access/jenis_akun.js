import { baca, tulis, pool } from '../../koneksi.js';
export async function tambahJenisAkunUntukJenisPaket(fasyankes_id, nama, syarat_profesi, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `jenis_akun` (`fasyankes_id`, `nama`, `syarat_profesi`) VALUES (?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (nama === undefined ? null : nama) ?? null, (syarat_profesi === undefined ? null : syarat_profesi) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function tambahJenisAkunUntukJenisPaketHasil(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`nama`, t.`syarat_profesi`, t.`aktif`, t.`diubah_oleh`, t.`alasan_perubahan`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `jenis_akun` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    if (!baris[0])
        throw new Error('Baris jenis_akun tidak ditemukan.');
    return baris[0];
}
export async function hapusJenisAkunUntukAksesIzinIntegrasiTest(fasyankes_id, koneksi = pool) {
    const hasil = await tulis("DELETE t FROM `jenis_akun` t WHERE ((? OR t.`fasyankes_id` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function hitungJenisAkunUntukAksesIzinIntegrasiTest(id, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `jenis_akun` t WHERE ((? OR t.`id` <=> ?))", [id === undefined, id ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function tambahJenisAkunUntukBuatPengguna(fasyankes_id, nama, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `jenis_akun` (`fasyankes_id`, `nama`) VALUES (?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (nama === undefined ? null : nama) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function hapusJenisAkunUntukFarmasiFarmasiIntegrasiTest(fasyankes_id, koneksi = pool) {
    const hasil = await tulis("DELETE t FROM `jenis_akun` t WHERE ((? OR t.`fasyankes_id` IN (?)))", [fasyankes_id === undefined, (fasyankes_id)?.length ? (fasyankes_id) : [null]], koneksi);
    return { count: hasil.affectedRows };
}
export async function hitungJenisAkunUntukSrcSkemaTest(fasyankes_id, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `jenis_akun` t WHERE ((? OR t.`fasyankes_id` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return Number(baris.jumlah);
}
export async function wajibJenisAkunUntukSrcSkemaTest(koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`nama`, t.`syarat_profesi`, t.`aktif`, t.`diubah_oleh`, t.`alasan_perubahan`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `jenis_akun` t WHERE TRUE LIMIT 1", [], koneksi);
    if (!baris[0])
        throw new Error('Baris jenis_akun tidak ditemukan.');
    return baris[0];
}
