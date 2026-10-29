import { prisma, pangkasPesanInstagram } from '@klira/db';
import { pulihkanPengirimanInstagram } from './pemulihan';
jest.mock('@klira/db', () => ({
  prisma: { igPesan: { findMany: jest.fn(), updateMany: jest.fn() }, $transaction: jest.fn() },
  kunciPercakapanInstagram: jest.fn(), pangkasPesanInstagram: jest.fn(),
}));
it('mengubah kiriman yang terhenti menjadi belum pasti tanpa pengiriman ulang', async () => {
  const waktu = Date.now();
  jest.mocked(prisma.igPesan.findMany).mockResolvedValue([{ id: 9, percakapan_id: 4 }] as never);
  jest.mocked(prisma.$transaction).mockImplementation(async (fn: unknown) => (fn as (tx: unknown) => Promise<unknown>)(prisma) as never);
  await pulihkanPengirimanInstagram();
  const query = jest.mocked(prisma.igPesan.findMany).mock.calls[0][0];
  const batas = (query?.where?.dibuat_pada as { lt: Date }).lt.getTime();
  expect(batas).toBeGreaterThanOrEqual(waktu - 120000);
  expect(batas).toBeLessThanOrEqual(Date.now() - 120000);
  expect(prisma.igPesan.updateMany).toHaveBeenCalledWith({ where: { id: 9, status: 'mengirim', dibuat_pada: { lt: new Date(batas) } }, data: { status: 'belum pasti' } });
  expect(pangkasPesanInstagram).toHaveBeenCalledWith(prisma, 4);
});
