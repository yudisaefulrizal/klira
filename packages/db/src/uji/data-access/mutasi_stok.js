import { baca, tulis, pool } from '../../koneksi.js';
export async function daftarMutasiStokUntukKasirKasirIntegrasiTest(fasyankes_id, jenis, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`stok_id`, t.`jenis`, t.`jumlah`, t.`alasan`, t.`pengguna_id`, t.`waktu` FROM `mutasi_stok` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`jenis` <=> ?)) ORDER BY t.`id` ASC", [fasyankes_id === undefined, fasyankes_id ?? null, jenis === undefined, jenis ?? null], koneksi);
    return baris;
}
export function hapusMutasiStokFasyankesUji(ids, koneksi = pool) {
    return tulis('DELETE FROM `mutasi_stok` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
