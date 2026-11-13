import { baca, tulis, pool } from '../../koneksi.js';
export async function hapusPengaturanKeamananUntukKeamananKeamananIntegrasiTest(fasyankes_id, koneksi = pool) {
    const hasil = await tulis("DELETE t FROM `pengaturan_keamanan` t WHERE ((? OR t.`fasyankes_id` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function hitungPengaturanKeamananUntukKeamananKeamananIntegrasiTest(fasyankes_id, koneksi = pool) {
    const [baris] = await baca("SELECT COUNT(*) AS jumlah FROM `pengaturan_keamanan` t WHERE ((? OR t.`fasyankes_id` <=> ?))", [fasyankes_id === undefined, fasyankes_id ?? null], koneksi);
    return Number(baris.jumlah);
}
