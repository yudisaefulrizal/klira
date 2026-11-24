import { baca, tulis, pool } from '../koneksi.js';
import { kelompokkan } from '../pemeta.js';
export async function tambahMutasiStokUntukSerahTerima(stok_id, jenis, jumlah, alasan, pengguna_id, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `mutasi_stok` (`stok_id`, `jenis`, `jumlah`, `alasan`, `pengguna_id`) VALUES (?, ?, ?, ?, ?)", [(stok_id === undefined ? null : stok_id) ?? null, ((jenis === undefined ? null : jenis) ?? null), (jumlah === undefined ? null : jumlah) ?? null, (alasan === undefined ? null : alasan) ?? null, (pengguna_id === undefined ? null : pengguna_id) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function daftarMutasiStokUntukRiwayatMutasi(master_obat_id, batas, koneksi = pool) {
    function petakt1(semua) {
        return kelompokkan(semua, 't1', [
            'batch',
        ]);
    }
    function petakt0(semua) {
        return kelompokkan(semua, 't0', [
            'id', 'stok_id', 'jenis', 'jumlah', 'alasan', 'pengguna_id', 'waktu',
            ['stok', (baris) => petakt1(baris)[0]],
        ]);
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`stok_id` AS `t0__stok_id`, t0.`jenis` AS `t0__jenis`, t0.`jumlah` AS `t0__jumlah`, t0.`alasan` AS `t0__alasan`, t0.`pengguna_id` AS `t0__pengguna_id`, t0.`waktu` AS `t0__waktu`, t1.`id` AS `t1__id`, t1.`batch` AS `t1__batch`\nFROM (SELECT t0.* FROM `mutasi_stok` t0 WHERE (EXISTS (SELECT 1 FROM `stok_obat` r1 WHERE t0.`stok_id` = r1.`id` AND (((? OR r1.`master_obat_id` <=> ?))))) ORDER BY t0.`id` DESC LIMIT ? OFFSET ?) t0\nLEFT JOIN (SELECT b1.* FROM `stok_obat` b1 WHERE TRUE) t1 ON t0.`stok_id` = t1.`id`\nORDER BY t0.`id` DESC, t1.`id` ASC", [master_obat_id === undefined, master_obat_id ?? null, batas ?? 2147483647, 0], koneksi);
    const hasil = petakt0(baris);
    return hasil;
}
