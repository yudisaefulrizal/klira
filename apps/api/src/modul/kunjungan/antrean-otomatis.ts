import type { Prisma } from '@klira/db';

/** Dipanggil dalam transaksi pelayanan; pembaruan bersyarat menjaga waktu pertama dan status terminal. */
export async function mulaiAntreanDalam(tx: Prisma.TransactionClient, fasyankesId: number, kunjunganId: number, waktu: Date): Promise<void> {
  const where = { fasyankes_id: fasyankesId, id: kunjunganId, tahap_layanan: { in: ['menunggu_skrining', 'pemeriksaan'] as ('menunggu_skrining' | 'pemeriksaan')[] }, NOT: { antrean: { is: { status: 'batal' as const } } } };
  const k = await tx.kunjungan.updateMany({ where: { ...where, status: { in: ['planned', 'arrived', 'in_progress'] } }, data: { status: 'in_progress' } });
  if (!k.count) return;
  const antrean = { fasyankes_id: fasyankesId, kunjungan_id: kunjunganId, status: { in: ['menunggu', 'dipanggil', 'dilayani'] as ('menunggu' | 'dipanggil' | 'dilayani')[] } };
  await tx.antrean.updateMany({ where: { ...antrean, waktu_mulai: null }, data: { waktu_mulai: waktu } });
  await tx.antrean.updateMany({ where: antrean, data: { status: 'dilayani' } });
}

export async function selesaiAntreanDalam(tx: Prisma.TransactionClient, fasyankesId: number, kunjunganId: number, waktu: Date): Promise<void> {
  const where = { fasyankes_id: fasyankesId, kunjungan_id: kunjunganId, status: { in: ['menunggu', 'dipanggil', 'dilayani'] as ('menunggu' | 'dipanggil' | 'dilayani')[] } };
  await tx.antrean.updateMany({ where: { ...where, waktu_selesai: null }, data: { waktu_selesai: waktu } });
  await tx.antrean.updateMany({ where, data: { status: 'selesai' } });
}
