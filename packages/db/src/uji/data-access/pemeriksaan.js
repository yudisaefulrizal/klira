import { baca, tulis, pool } from '../../koneksi.js';

export async function hitungPemeriksaanBagianUji(kunjungan_id, bagian, koneksi = pool) {
    const [baris] = await baca(
        'SELECT COUNT(*) AS jumlah FROM `pemeriksaan` t WHERE t.`kunjungan_id` <=> ? AND t.`bagian` <=> ?',
        [kunjungan_id ?? null, bagian ?? null],
        koneksi,
    );
    return Number(baris.jumlah);
}

export async function wajibPemeriksaanTandaVitalUji(kunjungan_id, koneksi = pool) {
    const baris = await baca(
        "SELECT * FROM `pemeriksaan` t WHERE t.`kunjungan_id` <=> ? AND t.`bagian` = 'tanda_vital' LIMIT 1",
        [kunjungan_id ?? null],
        koneksi,
    );
    if (!baris[0])
        throw new Error('Baris pemeriksaan tanda_vital tidak ditemukan.');
    return baris[0];
}

export async function ubahPemeriksaanTandaVitalSistolUji(tensi_sistol, kunjungan_id, koneksi = pool) {
    const hasil = await tulis(
        "UPDATE `pemeriksaan` SET `tensi_sistol` = ? WHERE `kunjungan_id` <=> ? AND `bagian` = 'tanda_vital'",
        [tensi_sistol ?? null, kunjungan_id ?? null],
        koneksi,
    );
    return { count: hasil.affectedRows };
}

export async function ubahPemeriksaanKeperawatanSkalaUji(nyeri_skala, kunjungan_id, versi, koneksi = pool) {
    const hasil = await tulis(
        "UPDATE `pemeriksaan` SET `nyeri_skala` = ? WHERE `kunjungan_id` <=> ? AND `bagian` = 'keperawatan' AND `versi` <=> ?",
        [nyeri_skala ?? null, kunjungan_id ?? null, versi ?? null],
        koneksi,
    );
    return { count: hasil.affectedRows };
}

export function hapusPemeriksaanFasyankesUji(ids, koneksi = pool) {
    return tulis('DELETE FROM `pemeriksaan` WHERE fasyankes_id IN (?)', [ids.length ? ids : [null]], koneksi);
}
