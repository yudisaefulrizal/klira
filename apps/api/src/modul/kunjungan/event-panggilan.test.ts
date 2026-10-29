import { prisma } from '@klira/db';
import { RepositoriKunjunganPrisma } from './repositori';
jest.mock('@klira/db', () => ({
  Prisma: jest.requireActual('@prisma/client').Prisma,
  prisma: { $transaction: jest.fn(), antrean: { findMany: jest.fn().mockResolvedValue([]) }, pasien: { findMany: jest.fn().mockResolvedValue([]) }, lokasi: { findMany: jest.fn().mockResolvedValue([]) } },
}));
const waktu = new Date('2026-10-29T03:00:00Z'), tanggal = new Date('2026-10-29T00:00:00Z');
function siapkan() {
  const tx = {
    $queryRaw: jest.fn().mockResolvedValue([]),
    antrean: { updateMany: jest.fn().mockResolvedValue({ count: 1 }), findUniqueOrThrow: jest.fn().mockResolvedValue({ lokasi_id: 9, nomor: 23, tanggal }) },
    lokasi: { findFirstOrThrow: jest.fn().mockResolvedValue({ nama: 'Poli Umum' }) },
    eventPanggilan: { create: jest.fn().mockResolvedValue({ id: 43 }) },
  };
  jest.mocked(prisma.$transaction).mockImplementation(async fn => (fn as (tx: unknown) => unknown)(tx) as never);
  return { tx, repo: new RepositoriKunjunganPrisma() };
}
beforeEach(() => jest.clearAllMocks());
test('panggil dan panggil ulang mencatat event masing-masing dalam transaksi status yang sama', async () => {
  const { tx, repo } = siapkan();
  await repo.ubahAntrean(7, 11, 'panggil', ['menunggu', 'dipanggil'], 'dipanggil', waktu);
  await repo.ubahAntrean(7, 11, 'panggil', ['menunggu', 'dipanggil'], 'dipanggil', waktu);
  expect(tx.eventPanggilan.create).toHaveBeenCalledTimes(2);
  expect(tx.eventPanggilan.create).toHaveBeenCalledWith({ data: { fasyankes_id: 7, poli_id: 9, poli_nama: 'Poli Umum', kode: 'A-023', tanggal, waktu_panggil: waktu } });
  expect(tx.$queryRaw).toHaveBeenCalledTimes(2);
  expect(tx.$queryRaw.mock.invocationCallOrder[0]).toBeLessThan(tx.antrean.updateMany.mock.invocationCallOrder[0]);
});
test('konflik perubahan status tidak menghasilkan event', async () => {
  const { tx, repo } = siapkan(); tx.antrean.updateMany.mockResolvedValue({ count: 0 });
  expect(await repo.ubahAntrean(7, 11, 'panggil', ['menunggu'], 'dipanggil', waktu)).toBeNull();
  expect(tx.eventPanggilan.create).not.toHaveBeenCalled();
});
test('gagal menulis event menggagalkan transaksi dan tidak membaca DTO sukses', async () => {
  const { tx, repo } = siapkan(); tx.eventPanggilan.create.mockRejectedValue(new Error('gagal simpan'));
  await expect(repo.ubahAntrean(7, 11, 'panggil', ['menunggu'], 'dipanggil', waktu)).rejects.toThrow('gagal simpan');
  expect(prisma.antrean.findMany).not.toHaveBeenCalled();
});
test('aksi batal tidak membuat event suara', async () => {
  const { tx, repo } = siapkan();
  await repo.ubahAntrean(7, 11, 'batal', ['menunggu'], 'batal', waktu);
  expect(tx.eventPanggilan.create).not.toHaveBeenCalled();
});
