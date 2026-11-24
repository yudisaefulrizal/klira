import * as db from '@klira/db';
/** Antrean baru berjalan setelah skrining selesai (tahap pemeriksaan); skrining tidak menjalankan antrean. Dipanggil dalam transaksi pelayanan; pembaruan bersyarat menjaga waktu pertama dan status terminal. */
export async function mulaiAntreanDalam(tx, kunjunganId, waktu) {
    const k = await db.ubahKunjunganUntukMulaiAntreanDalam('in-progress', kunjunganId, ['pemeriksaan'], 'batal', ['planned', 'arrived', 'in-progress'], tx);
    if (!k.count)
        return;
    await db.ubahAntreanUntukMulaiAntreanDalam(waktu, kunjunganId, ['menunggu', 'dipanggil', 'dilayani'], null, tx);
    await db.ubahAntreanUntukMulaiAntreanDalam2('dilayani', kunjunganId, ['menunggu', 'dipanggil', 'dilayani'], tx);
}
export async function selesaiAntreanDalam(tx, kunjunganId, waktu) {
    await db.ubahAntreanUntukSelesaiAntreanDalam(waktu, kunjunganId, ['menunggu', 'dipanggil', 'dilayani'], null, tx);
    await db.ubahAntreanUntukMulaiAntreanDalam2('selesai', kunjunganId, ['menunggu', 'dipanggil', 'dilayani'], tx);
}
