import { baca, tulis, pool } from '../../koneksi.js';
export async function hapusWilayahUntukSeedWilayahTest(kode, koneksi = pool) {
    const hasil = await tulis("DELETE t FROM `wilayah` t WHERE ((? OR t.`kode` IN (?)))", [kode === undefined, (kode)?.length ? (kode) : [null]], koneksi);
    return { count: hasil.affectedRows };
}
export async function hitungWilayahUntukSeedWilayahTest(kode, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `wilayah` t WHERE ((? OR t.`kode` LIKE ? ESCAPE '!'))", [kode === undefined, String(kode ?? '').replace(/[!%_]/g, teken => '!' + teken) + '%'], koneksi);
    return Number(baris.jumlah);
}
export async function wajibWilayahUntukSeedWilayahTest(kode, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`kode`, t.`nama`, t.`tingkat`, t.`induk_kode`, t.`contoh`, t.`dibuat_pada` FROM `wilayah` t WHERE ((? OR t.`kode` <=> ?)) LIMIT 1", [kode === undefined, kode ?? null], koneksi);
    if (!baris[0])
        throw new Error('Baris wilayah tidak ditemukan.');
    return baris[0];
}
