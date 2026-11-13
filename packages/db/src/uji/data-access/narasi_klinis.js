import { tulis, pool } from '../../koneksi.js';
export async function tambahNarasiKlinisUntukKlaimKlaimIntegrasiTest(fasyankes_id, kunjungan_id, bagian, isi, versi, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `narasi_klinis` (`fasyankes_id`, `kunjungan_id`, `bagian`, `isi`, `versi`) VALUES (?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (kunjungan_id === undefined ? null : kunjungan_id) ?? null, ((bagian === undefined ? null : bagian) ?? null), (isi === undefined ? null : isi) ?? null, (versi === undefined ? null : versi) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export function hapusNarasiKlinisFasyankesUji(ids, koneksi = pool) {
    return tulis('DELETE FROM `narasi_klinis` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
