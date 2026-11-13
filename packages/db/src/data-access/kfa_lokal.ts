import { baca, pool, type Koneksi } from '../koneksi';


export async function daftarKfaLokalUntukKfaLokal(fasyankes_id: number | undefined, kode: string | undefined, koneksi: Koneksi = pool) {
  const baris = await baca<{ kode: string; nama: string; bentuk_sediaan: string | null; satuan: string | null; status: string }>("SELECT t.`kode`, t.`nama`, t.`bentuk_sediaan`, t.`satuan`, t.`status` FROM `kfa_lokal` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`kode` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null, kode === undefined, kode ?? null], koneksi);
  return baris;
}
