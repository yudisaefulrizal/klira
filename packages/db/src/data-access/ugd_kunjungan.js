import { baca, tulis, pool } from '../koneksi.js';

const parseJson = (v, bawaan) => (typeof v === 'string' ? JSON.parse(v) : (v ?? bawaan));

/** Baca catatan triase & survei primer UGD untuk kunjungan tertentu. */
export async function bacaUgdKunjungan(kunjungan_id, koneksi = pool) {
    const baris = await baca(
        'SELECT `id`, `pasien_id`, `kunjungan_id`, `triase`, `waktu_triase`, `data`, `diperbarui_oleh`, `diperbarui_pada` FROM `ugd_kunjungan` WHERE `kunjungan_id` = ? LIMIT 1',
        [kunjungan_id],
        koneksi,
    );
    const b = baris[0];
    if (!b) return null;
    b.data = parseJson(b.data, {});
    return b;
}

/** Simpan atau perbarui catatan triase & survei primer UGD kunjungan; mempertahankan `waktu_triase` pertama. */
export async function simpanUgdKunjungan(pasien_id, kunjungan_id, triase, data, diperbarui_oleh, koneksi = pool) {
    await tulis(
        'INSERT INTO `ugd_kunjungan` (`pasien_id`, `kunjungan_id`, `triase`, `waktu_triase`, `data`, `diperbarui_oleh`, `diperbarui_pada`) VALUES (?, ?, ?, NOW(3), ?, ?, NOW(3)) ON DUPLICATE KEY UPDATE `triase` = VALUES(`triase`), `data` = VALUES(`data`), `diperbarui_oleh` = VALUES(`diperbarui_oleh`), `diperbarui_pada` = NOW(3)',
        [pasien_id, kunjungan_id, triase, JSON.stringify(data ?? {}), diperbarui_oleh ?? null],
        koneksi,
    );
    return bacaUgdKunjungan(kunjungan_id, koneksi);
}
