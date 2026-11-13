import { baca, tulis, pool } from '../../koneksi.js';
export async function hitungAnamnesisUntukKlinisKlinisIntegrasiTest(kunjungan_id, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `anamnesis` t WHERE ((? OR t.`kunjungan_id` <=> ?))", [kunjungan_id === undefined, kunjungan_id ?? null], koneksi);
    return Number(baris.jumlah);
}
export function hapusAnamnesisFasyankesUji(ids, koneksi = pool) {
    return tulis('DELETE FROM `anamnesis` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
