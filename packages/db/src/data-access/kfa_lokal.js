import { baca, pool } from '../koneksi.js';
export async function daftarKfaLokalUntukKfaLokal(kode, koneksi = pool) {
    const baris = await baca("SELECT t.`kode`, t.`nama`, t.`bentuk_sediaan`, t.`satuan`, t.`status` FROM `kfa_lokal` t WHERE ((? OR t.`kode` <=> ?))", [kode === undefined, kode ?? null], koneksi);
    return baris;
}
