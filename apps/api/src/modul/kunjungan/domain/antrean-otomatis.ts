import * as db from '@klira/db';

/** Dipanggil dalam transaksi pelayanan; pembaruan bersyarat menjaga waktu pertama dan status terminal. */
export async function mulaiAntreanDalam(tx: db.Koneksi, fasyankesId: number, kunjunganId: number, waktu: Date): Promise<void> {

  const k = await db.ubahKunjunganUntukMulaiAntreanDalam('in-progress', fasyankesId, kunjunganId, ['menunggu_skrining', 'pemeriksaan'] as ('menunggu_skrining' | 'pemeriksaan')[], 'batal' as const, ['planned', 'arrived', 'in-progress'], tx);
  if (!k.count) return;

  await db.ubahAntreanUntukMulaiAntreanDalam(waktu, fasyankesId, kunjunganId, ['menunggu', 'dipanggil', 'dilayani'] as ('menunggu' | 'dipanggil' | 'dilayani')[], null, tx);
  await db.ubahAntreanUntukMulaiAntreanDalam2('dilayani', fasyankesId, kunjunganId, ['menunggu', 'dipanggil', 'dilayani'] as ('menunggu' | 'dipanggil' | 'dilayani')[], tx);
}

export async function selesaiAntreanDalam(tx: db.Koneksi, fasyankesId: number, kunjunganId: number, waktu: Date): Promise<void> {

  await db.ubahAntreanUntukSelesaiAntreanDalam(waktu, fasyankesId, kunjunganId, ['menunggu', 'dipanggil', 'dilayani'] as ('menunggu' | 'dipanggil' | 'dilayani')[], null, tx);
  await db.ubahAntreanUntukMulaiAntreanDalam2('selesai', fasyankesId, kunjunganId, ['menunggu', 'dipanggil', 'dilayani'] as ('menunggu' | 'dipanggil' | 'dilayani')[], tx);
}
