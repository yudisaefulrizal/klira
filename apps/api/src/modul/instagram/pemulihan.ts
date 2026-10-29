import { prisma, kunciPercakapanInstagram, pangkasPesanInstagram } from '@klira/db';
/** Network requests time out at 20s; after 2min an interrupted send is uncertain and must never be retried automatically. */
export async function pulihkanPengirimanInstagram() {
  const batas = new Date(Date.now() - 120000);
  const rows = await prisma.igPesan.findMany({ where: { arah: 'keluar', status: 'mengirim', dibuat_pada: { lt: batas } }, select: { id: true, percakapan_id: true }, take: 100 });
  for (const row of rows) await prisma.$transaction(async (tx) => {
    await kunciPercakapanInstagram(tx, row.percakapan_id);
    await tx.igPesan.updateMany({ where: { id: row.id, status: 'mengirim', dibuat_pada: { lt: batas } }, data: { status: 'belum pasti' } });
    await pangkasPesanInstagram(tx, row.percakapan_id);
  });
}
