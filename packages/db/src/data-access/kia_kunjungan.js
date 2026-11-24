import { baca, tulis, pool } from '../koneksi.js';

const parseJson = (v, bawaan) => (typeof v === 'string' ? JSON.parse(v) : (v ?? bawaan));

/** Baca data KIA untuk kunjungan tertentu; jika belum ada, ambil riwayat KIA terakhir pasien sebagai acuan awal. */
export async function bacaKiaKunjungan(kunjungan_id, pasien_id, koneksi = pool) {
    const baris = await baca(
        'SELECT `id`, `pasien_id`, `kunjungan_id`, `layanan`, `data`, `diperbarui_oleh`, `diperbarui_pada` FROM `kia_kunjungan` WHERE `kunjungan_id` = ? LIMIT 1',
        [kunjungan_id],
        koneksi,
    );
    if (baris[0]) {
        baris[0].data = parseJson(baris[0].data, {});
        return { sumber: 'kunjungan', ...baris[0] };
    }
    if (!pasien_id) return null;
    const terakhir = await baca(
        'SELECT `layanan`, `data` FROM `kia_kunjungan` WHERE `pasien_id` = ? ORDER BY `diperbarui_pada` DESC, `id` DESC LIMIT 1',
        [pasien_id],
        koneksi,
    );
    if (!terakhir[0]) return null;
    const d = parseJson(terakhir[0].data, {});
    return {
        sumber: 'riwayat',
        pasien_id,
        kunjungan_id,
        layanan: terakhir[0].layanan,
        // Bawa data dasar obstetri/KB dari kunjungan sebelumnya agar bidan tidak mengetik ulang G/P/A/HPHT/metode KB.
        data: terakhir[0].layanan === 'anc'
            ? { g: d.g ?? '', p: d.p ?? '', a: d.a ?? '', hpht: d.hpht ?? '', tt: d.tt ?? '' }
            : terakhir[0].layanan === 'kb'
                ? { metode_kb: d.metode_kb ?? '' }
                : {},
    };
}

/** Simpan atau perbarui data KIA terstruktur pada suatu kunjungan. */
export async function simpanKiaKunjungan(pasien_id, kunjungan_id, layanan, data, diperbarui_oleh, koneksi = pool) {
    await tulis(
        'INSERT INTO `kia_kunjungan` (`pasien_id`, `kunjungan_id`, `layanan`, `data`, `diperbarui_oleh`, `diperbarui_pada`) VALUES (?, ?, ?, ?, ?, NOW(3)) ON DUPLICATE KEY UPDATE `layanan` = VALUES(`layanan`), `data` = VALUES(`data`), `diperbarui_oleh` = VALUES(`diperbarui_oleh`), `diperbarui_pada` = NOW(3)',
        [pasien_id, kunjungan_id, layanan, JSON.stringify(data ?? {}), diperbarui_oleh ?? null],
        koneksi,
    );
    return bacaKiaKunjungan(kunjungan_id, pasien_id, koneksi);
}
