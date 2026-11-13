import * as db from '@klira/db';
/** Dipanggil dalam transaksi pelayanan; pembaruan bersyarat menjaga waktu pertama dan status terminal. */
export async function mulaiAntreanDalam(tx, fasyankesId, kunjunganId, waktu) {
    const k = await db.ubahKunjunganUntukMulaiAntreanDalam('in-progress', fasyankesId, kunjunganId, ['menunggu_skrining', 'pemeriksaan'], 'batal', ['planned', 'arrived', 'in-progress'], tx);
    if (!k.count)
        return;
    await db.ubahAntreanUntukMulaiAntreanDalam(waktu, fasyankesId, kunjunganId, ['menunggu', 'dipanggil', 'dilayani'], null, tx);
    await db.ubahAntreanUntukMulaiAntreanDalam2('dilayani', fasyankesId, kunjunganId, ['menunggu', 'dipanggil', 'dilayani'], tx);
}
export async function selesaiAntreanDalam(tx, fasyankesId, kunjunganId, waktu) {
    await db.ubahAntreanUntukSelesaiAntreanDalam(waktu, fasyankesId, kunjunganId, ['menunggu', 'dipanggil', 'dilayani'], null, tx);
    await db.ubahAntreanUntukMulaiAntreanDalam2('selesai', fasyankesId, kunjunganId, ['menunggu', 'dipanggil', 'dilayani'], tx);
}
