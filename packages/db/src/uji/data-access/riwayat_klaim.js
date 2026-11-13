import { baca, tulis, pool } from '../../koneksi.js';
export async function hitungRiwayatKlaimUntukKlaimKlaimIntegrasiTest(klaim_id, dari, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `riwayat_klaim` t WHERE ((? OR t.`klaim_id` <=> ?)) AND ((? OR t.`dari` <=> ?))", [klaim_id === undefined, klaim_id ?? null, dari === undefined, dari ?? null], koneksi);
    return Number(baris.jumlah);
}
export function hapusRiwayatKlaimFasyankesUji(ids, koneksi = pool) {
    return tulis('DELETE FROM `riwayat_klaim` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
