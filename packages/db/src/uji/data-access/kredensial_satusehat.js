import { baca, tulis, pool } from '../../koneksi.js';
export async function tambahKredensialSatusehatUntukSrcSkemaTest(fasyankes_id, environment, client_id, client_secret_terenkripsi, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `kredensial_satusehat` (`fasyankes_id`, `environment`, `client_id`, `client_secret_terenkripsi`) VALUES (?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, ((environment === undefined ? null : environment) ?? null), (client_id === undefined ? null : client_id) ?? null, (client_secret_terenkripsi === undefined ? null : client_secret_terenkripsi) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function tambahKredensialSatusehatUntukSrcSkemaTestHasil(id, koneksi = pool) {
    const baris = await baca("SELECT t.`id`, t.`fasyankes_id`, t.`environment`, t.`client_id`, t.`client_secret_terenkripsi`, t.`dibuat_oleh`, t.`dibuat_pada` FROM `kredensial_satusehat` t WHERE ((? OR t.`id` <=> ?)) LIMIT 1", [id === undefined, id ?? null], koneksi);
    if (!baris[0])
        throw new Error('Baris kredensial_satusehat tidak ditemukan.');
    return baris[0];
}
