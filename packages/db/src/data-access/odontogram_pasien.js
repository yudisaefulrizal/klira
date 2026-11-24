import { baca, tulis, pool } from '../koneksi.js';

const parseJson = (v, bawaan) => (typeof v === 'string' ? JSON.parse(v) : (v ?? bawaan));

/** Baca status odontogram kumulatif terakhir milik pasien pada fasyankes terkait. */
export async function bacaOdontogramPasien(pasien_id, koneksi = pool) {
    const baris = await baca(
        'SELECT `id`, `pasien_id`, `kunjungan_id`, `gigi`, `intraoral`, `diperbarui_oleh`, `diperbarui_pada` FROM `odontogram_pasien` WHERE `pasien_id` = ? LIMIT 1',
        [pasien_id],
        koneksi,
    );
    const b = baris[0];
    if (!b) return null;
    b.gigi = parseJson(b.gigi, {});
    b.intraoral = parseJson(b.intraoral, {});
    return b;
}

/** Simpan atau perbarui status odontogram kumulatif pasien. */
export async function simpanOdontogramPasien(pasien_id, kunjungan_id, gigi, intraoral, diperbarui_oleh, koneksi = pool) {
    await tulis(
        'INSERT INTO `odontogram_pasien` (`pasien_id`, `kunjungan_id`, `gigi`, `intraoral`, `diperbarui_oleh`, `diperbarui_pada`) VALUES (?, ?, ?, ?, ?, NOW(3)) ON DUPLICATE KEY UPDATE `kunjungan_id` = VALUES(`kunjungan_id`), `gigi` = VALUES(`gigi`), `intraoral` = VALUES(`intraoral`), `diperbarui_oleh` = VALUES(`diperbarui_oleh`), `diperbarui_pada` = NOW(3)',
        [pasien_id, kunjungan_id ?? null, JSON.stringify(gigi ?? {}), JSON.stringify(intraoral ?? {}), diperbarui_oleh ?? null],
        koneksi,
    );
    return bacaOdontogramPasien(pasien_id, koneksi);
}
