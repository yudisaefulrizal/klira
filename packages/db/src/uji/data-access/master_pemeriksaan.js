import { baca, tulis, pool } from '../../koneksi.js';
export async function hitungMasterPemeriksaanUntukPenunjangPenunjangIntegrasiTest(fasyankes_id, kode, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `master_pemeriksaan` t WHERE ((? OR t.`fasyankes_id` <=> ?)) AND ((? OR t.`kode` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null, kode === undefined, kode ?? null], koneksi);
    return Number(baris.jumlah);
}
export function hapusMasterPemeriksaanFasyankesUji(ids, koneksi = pool) {
    return tulis('DELETE FROM `master_pemeriksaan` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
