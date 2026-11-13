import { baca, pool } from '../koneksi.js';
export async function daftarKfaLokalUntukKfaLokal(fasyankes_id, kode, koneksi = pool) {
    const baris = await baca("SELECT t.`kode`, t.`nama`, t.`bentuk_sediaan`, t.`satuan`, t.`status` FROM `kfa_lokal` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`kode` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null, kode === undefined, kode ?? null], koneksi);
    return baris;
}
