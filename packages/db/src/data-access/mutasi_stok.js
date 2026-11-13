import { baca, tulis, pool } from '../koneksi.js';
export async function tambahMutasiStokUntukSerahTerima(fasyankes_id, stok_id, jenis, jumlah, alasan, pengguna_id, koneksi = pool) {
    const hasil = await tulis("INSERT INTO `mutasi_stok` (`fasyankes_id`, `stok_id`, `jenis`, `jumlah`, `alasan`, `pengguna_id`) VALUES (?, ?, ?, ?, ?, ?)", [(fasyankes_id === undefined ? null : fasyankes_id) ?? null, (stok_id === undefined ? null : stok_id) ?? null, ((jenis === undefined ? null : jenis) ?? null), (jumlah === undefined ? null : jumlah) ?? null, (alasan === undefined ? null : alasan) ?? null, (pengguna_id === undefined ? null : pengguna_id) ?? null], koneksi);
    return { id: hasil.insertId, count: hasil.affectedRows };
}
export async function daftarMutasiStokUntukRiwayatMutasi(fasyankes_id, master_obat_id, batas, koneksi = pool) {
    function petakt1(semua) {
        const grup = new Map();
        for (const baris of semua) {
            if (baris.t1__id === null)
                continue;
            const kunci = String(baris.t1__id);
            const isi = grup.get(kunci);
            if (isi)
                isi.push(baris);
            else
                grup.set(kunci, [baris]);
        }
        return [...grup.values()].map(baris => ({ batch: baris[0].t1__batch }));
    }
    function petakt0(semua) {
        const grup = new Map();
        for (const baris of semua) {
            if (baris.t0__id === null)
                continue;
            const kunci = String(baris.t0__id);
            const isi = grup.get(kunci);
            if (isi)
                isi.push(baris);
            else
                grup.set(kunci, [baris]);
        }
        return [...grup.values()].map(baris => ({ id: baris[0].t0__id, fasyankes_id: baris[0].t0__fasyankes_id, stok_id: baris[0].t0__stok_id, jenis: baris[0].t0__jenis, jumlah: baris[0].t0__jumlah, alasan: baris[0].t0__alasan, pengguna_id: baris[0].t0__pengguna_id, waktu: baris[0].t0__waktu, stok: petakt1(baris)[0] }));
    }
    const baris = await baca("SELECT t0.`id` AS `t0__id`, t0.`fasyankes_id` AS `t0__fasyankes_id`, t0.`stok_id` AS `t0__stok_id`, t0.`jenis` AS `t0__jenis`, t0.`jumlah` AS `t0__jumlah`, t0.`alasan` AS `t0__alasan`, t0.`pengguna_id` AS `t0__pengguna_id`, t0.`waktu` AS `t0__waktu`, t1.`id` AS `t1__id`, t1.`batch` AS `t1__batch`\nFROM (SELECT t0.* FROM `mutasi_stok` t0 WHERE ((? OR t0.`fasyankes_id` <=> ?)) AND (EXISTS (SELECT 1 FROM `stok_obat` r1 WHERE t0.`stok_id` = r1.`id` AND (((? OR r1.`master_obat_id` <=> ?))))) ORDER BY t0.`id` DESC LIMIT ? OFFSET ?) t0\nLEFT JOIN (SELECT b1.* FROM `stok_obat` b1 WHERE TRUE) t1 ON t0.`stok_id` = t1.`id`\nORDER BY t0.`id` DESC, t1.`id` ASC", [fasyankes_id === undefined, fasyankes_id ?? null, master_obat_id === undefined, master_obat_id ?? null, batas ?? 2147483647, 0], koneksi);
    const hasil = petakt0(baris);
    return hasil;
}
