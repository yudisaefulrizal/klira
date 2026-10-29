import type { Prisma } from '@prisma/client';
import { prisma } from './klien';
export const BATAS_PESAN_INSTAGRAM = 10;
export const STATUS_ANTRE_INSTAGRAM = ['antre', 'mengirim'];
/** Semua penulis pesan mengunci percakapan yang sama sebelum membuat/menghapus pesan. */
export async function kunciPercakapanInstagram(tx: Prisma.TransactionClient, id: number) {
  await tx.$queryRaw`SELECT id FROM ig_percakapan WHERE id = ${id} FOR UPDATE`;
}
/** Dipanggil dalam transaksi yang sudah mengunci percakapan. Antrean belum dihitung sebagai riwayat selesai. */
export async function pangkasPesanInstagram(tx: Prisma.TransactionClient, id: number) {
  const lama = await tx.igPesan.findMany({
    where: { percakapan_id: id, status: { notIn: STATUS_ANTRE_INSTAGRAM } },
    orderBy: { id: 'desc' },
    skip: BATAS_PESAN_INSTAGRAM,
    select: { id: true, media_id: true },
  });
  if (!lama.length) return 0;
  await tx.igPesan.deleteMany({
    where: { id: { in: lama.map((p) => p.id) }, status: { notIn: STATUS_ANTRE_INSTAGRAM } },
  });
  const kandidat = [...new Set(lama.flatMap((p) => (p.media_id ? [p.media_id] : [])))];
  if (kandidat.length) {
    const dipakai = await tx.igPesan.findMany({ where: { media_id: { in: kandidat } }, select: { media_id: true } });
    const masihDipakai = new Set(dipakai.map((p) => p.media_id));
    await tx.igMedia.deleteMany({ where: { id: { in: kandidat.filter((id) => !masihDipakai.has(id)) } } });
  }
  return lama.length;
}
/** Menyesuaikan riwayat lama saat engine mulai, termasuk ketika halaman tidak dibuka. */
export async function rapikanRiwayatInstagram(fasyankesId?: number) {
  let sesudah = 0;
  let dihapus = 0;
  while (true) {
    const baris = await prisma.igPercakapan.findMany({
      where: { id: { gt: sesudah }, ...(fasyankesId ? { fasyankes_id: fasyankesId } : {}) },
      orderBy: { id: 'asc' },
      take: 100,
      select: { id: true },
    });
    if (!baris.length) return dihapus;
    for (const row of baris)
      dihapus += await prisma.$transaction(async (tx) => {
        await kunciPercakapanInstagram(tx, row.id);
        return pangkasPesanInstagram(tx, row.id);
      });
    sesudah = baris[baris.length - 1].id;
  }
}
