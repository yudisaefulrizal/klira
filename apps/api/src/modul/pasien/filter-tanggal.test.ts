import { filterPasien } from '@klira/shared';
import { prisma } from '@klira/db';
import { RepositoriPasienPrisma } from './repositori';

jest.mock('@klira/db', () => ({ prisma: {
  kunjungan: { groupBy: jest.fn(), count: jest.fn(), findMany: jest.fn() },
  pasien: { count: jest.fn(), findMany: jest.fn() },
} }));

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(prisma.kunjungan.groupBy).mockResolvedValue([]);
  jest.mocked(prisma.kunjungan.count).mockResolvedValue(0);
  jest.mocked(prisma.kunjungan.findMany).mockResolvedValue([]);
  jest.mocked(prisma.pasien.count).mockResolvedValue(0);
  jest.mocked(prisma.pasien.findMany).mockResolvedValue([]);
});

test('tanggal bawaan mengikuti pergantian hari WIB dan menolak tanggal mustahil', async () => {
  jest.useFakeTimers().setSystemTime(new Date('2026-10-28T17:00:00Z'));
  try {
    await new RepositoriPasienPrisma().cari(7, { tahap: 'semua', lewati: 0, ambil: 20 });
    expect(prisma.kunjungan.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ mulai: { gte: new Date('2026-10-28T17:00:00Z'), lt: new Date('2026-10-29T17:00:00Z') } }) }));
    expect(filterPasien.safeParse({ tanggal: '2026-02-30' }).success).toBe(false);
  } finally { jest.useRealTimers(); }
});

test.each(['semua', 'ditutup', 'batal'] as const)('filter %s dan jumlah tahap memakai batas hari WIB yang sama', async (tahap) => {
  await new RepositoriPasienPrisma().cari(7, { tanggal: '2026-10-29', tahap, lewati: 0, ambil: 20 });
  const mulai = { gte: new Date('2026-10-28T17:00:00Z'), lt: new Date('2026-10-29T17:00:00Z') };
  expect(prisma.kunjungan.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ fasyankes_id: 7, mulai }) }));
  expect(prisma.kunjungan.groupBy).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ fasyankes_id: 7, mulai }) }));
  expect(prisma.kunjungan.count).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ fasyankes_id: 7, mulai }) }));
});

test('pencarian tetap mengikuti tanggal terpilih', async () => {
  await new RepositoriPasienPrisma().cari(7, { tanggal: '2026-10-28', cari: 'Siti', tahap: 'semua', lewati: 0, ambil: 20 });
  expect(prisma.pasien.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({
    kunjungan: { some: expect.objectContaining({ mulai: { gte: new Date('2026-10-27T17:00:00Z'), lt: new Date('2026-10-28T17:00:00Z') } }) },
  }) }));
});

 test('pemilih pasien tanpa tanggal tetap dapat mencari pasien yang belum berkunjung', async () => {
   await new RepositoriPasienPrisma().cari(7, { cari: 'Siti', tahap: 'semua', lewati: 0, ambil: 10 });
   const panggilan = jest.mocked(prisma.pasien.findMany).mock.calls[0][0];
   expect(panggilan?.where).not.toHaveProperty('kunjungan');
 });
