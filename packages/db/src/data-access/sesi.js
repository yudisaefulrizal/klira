import { baca, tulis, pool } from '../koneksi.js';
import { kelompokkan } from '../pemeta.js';
export async function tambahSesiUntukBuatSesi(pengguna_id, id_hash, alamat, kedaluwarsa_pada, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `sesi` (`pengguna_id`, `id_hash`, `alamat`, `kedaluwarsa_pada`) VALUES (?, ?, ?, ?)", [(pengguna_id === undefined ? null : pengguna_id) ?? null, (id_hash === undefined ? null : id_hash) ?? null, (alamat === undefined ? null : alamat) ?? null, (kedaluwarsa_pada === undefined ? null : kedaluwarsa_pada) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function cariSesiUntukCariSesi(id_hash, kedaluwarsa_pada, aktif, koneksi = pool) {
    function petakt1(semua) {
        return kelompokkan(semua, 't1', [
            'id', 'nama', 'username', 'kata_sandi_hash', 'aktif', 'wajib_ganti_kredensial',
        ]);
    }
    function petakt0(semua) {
        return kelompokkan(semua, 't0', [
            'id', 'pengguna_id', 'id_hash', 'alamat', 'dibuat_pada', 'kedaluwarsa_pada',
            ['pengguna', (baris) => petakt1(baris)[0]],
        ]);
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`pengguna_id` AS `t0__pengguna_id`, t0.`id_hash` AS `t0__id_hash`, t0.`alamat` AS `t0__alamat`, t0.`dibuat_pada` AS `t0__dibuat_pada`, t0.`kedaluwarsa_pada` AS `t0__kedaluwarsa_pada`, t1.`id` AS `t1__id`, t1.`nama` AS `t1__nama`, t1.`username` AS `t1__username`, t1.`kata_sandi_hash` AS `t1__kata_sandi_hash`, t1.`aktif` AS `t1__aktif`, t1.`wajib_ganti_kredensial` AS `t1__wajib_ganti_kredensial`\nFROM (SELECT t0.* FROM `sesi` t0 WHERE ((? OR t0.`id_hash` <=> ?)) AND ((? OR t0.`kedaluwarsa_pada` > ?)) AND (EXISTS (SELECT 1 FROM `pengguna` r1 WHERE t0.`pengguna_id` = r1.`id` AND (((? OR r1.`aktif` <=> ?))))) LIMIT 1) t0\nLEFT JOIN (SELECT b1.* FROM `pengguna` b1 WHERE TRUE) t1 ON t0.`pengguna_id` = t1.`id`\nORDER BY t1.`id` ASC", [id_hash === undefined, id_hash ?? null, kedaluwarsa_pada === undefined, kedaluwarsa_pada ?? null, aktif === undefined, aktif ?? null], koneksi);
    const hasil = petakt0(baris);
    return (hasil[0] ?? null);
}
export async function hapusSesiUntukHapusSesi(id_hash, koneksi = pool) {
    const hasil = await tulis("DELETE t FROM `sesi` t WHERE ((? OR t.`id_hash` <=> ?))", [id_hash === undefined, id_hash ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function hapusSesiKedaluwarsa(kedaluwarsa_pada, koneksi = pool) {
    const hasil = await tulis("DELETE t FROM `sesi` t WHERE ((? OR t.`kedaluwarsa_pada` <= ?))", [kedaluwarsa_pada === undefined, kedaluwarsa_pada ?? null], koneksi);
    return { count: hasil.affectedRows };
}
export async function hapusSesiPengguna(pengguna_id, koneksi = pool) {
    const hasil = await tulis("DELETE t FROM `sesi` t WHERE ((? OR t.`pengguna_id` <=> ?))", [pengguna_id === undefined, pengguna_id ?? null], koneksi);
    return { count: hasil.affectedRows };
}
