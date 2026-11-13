import { baca, tulis, pool } from '../../koneksi.js';
export async function tambahResumeMedisUntukKlaimKlaimIntegrasiTest(fasyankes_id, kunjungan_id, isi, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `resume_medis` (`fasyankes_id`, `kunjungan_id`, `isi`) VALUES (?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (kunjungan_id === undefined ? null : kunjungan_id) ?? null, JSON.stringify((isi === undefined ? null : isi) ?? null)], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function hitungResumeMedisUntukRawatInapRawatInapIntegrasiTest(kunjungan_id, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `resume_medis` t WHERE ((? OR t.`kunjungan_id` <=> ?))", [kunjungan_id === undefined, kunjungan_id ?? null], koneksi);
    return Number(baris.jumlah);
}
export function hapusResumeMedisFasyankesUji(ids, koneksi = pool) {
    return tulis('DELETE FROM `resume_medis` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
