import { baca, tulis, pool } from '../../koneksi.js';
export async function daftarPengeluaranObatUntukKasirKasirIntegrasiTest(resep_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`resep_id`, t.`item_resep_id`, t.`master_obat_id`, t.`jumlah`, t.`harga`, t.`stok_kurang`, t.`alasan`, t.`petugas_id`, t.`waktu` FROM `pengeluaran_obat` t WHERE ((? OR t.`resep_id` <=> ?))", [resep_id === undefined, resep_id ?? null], koneksi);
    return baris;
}
export async function cariPengeluaranObatUntukKasirKasirIntegrasiTest(resep_id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`resep_id`, t.`item_resep_id`, t.`master_obat_id`, t.`jumlah`, t.`harga`, t.`stok_kurang`, t.`alasan`, t.`petugas_id`, t.`waktu` FROM `pengeluaran_obat` t WHERE ((? OR t.`resep_id` <=> ?)) LIMIT 1", [resep_id === undefined, resep_id ?? null], koneksi);
    return (baris[0] ?? null);
}
export async function hitungPengeluaranObatUntukKasirKasirIntegrasiTest(resep_id, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `pengeluaran_obat` t WHERE ((? OR t.`resep_id` <=> ?))", [resep_id === undefined, resep_id ?? null], koneksi);
    return Number(baris.jumlah);
}
export function hapusPengeluaranObatFasyankesUji(ids, koneksi = pool) {
    return tulis('DELETE FROM `pengeluaran_obat` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
