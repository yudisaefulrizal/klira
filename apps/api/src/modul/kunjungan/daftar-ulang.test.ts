import { prisma } from '@klira/db';
import { KunjunganBerjalanError, RepositoriKunjunganPrisma } from './repositori';

jest.mock('@klira/db', () => ({
  Prisma: jest.requireActual('@prisma/client').Prisma,
  prisma: { kunjungan: { count: jest.fn() }, $transaction: jest.fn() },
}));

const repo = new RepositoriKunjunganPrisma();
const waktu = new Date('2026-10-29T02:00:00Z');
const data = { pasien_id: 10, jenis: 'AMB' as const, lokasi_id: 3, cara_pembayaran: 'umum' as const, nomor_sep: null, keluhan_singkat: null };
const filter = { fasyankes_id: 7, pasien_id: 10, NOT: { antrean: { is: { status: 'batal' } } } };
const baru = { id: 22, pasien_id: 10, jenis: 'AMB', status: 'arrived', tahap_layanan: 'menunggu_skrining', cara_pembayaran: 'umum', nomor_sep: null, lokasi_id: 3, keluhan_singkat: null, mulai: waktu, peserta: [], antrean: { id: 32, nomor: 1, status: 'menunggu' } };

beforeEach(() => jest.clearAllMocks());

test('pemeriksaan awal mengabaikan antrean batal, termasuk data lama', async () => {
  jest.mocked(prisma.kunjungan.count).mockResolvedValue(0);
  expect(await repo.kunjunganBerjalan(7, 10)).toBe(false);
  expect(prisma.kunjungan.count).toHaveBeenCalledWith({ where: expect.objectContaining(filter) });
});

test('pendaftaran ulang memeriksa kembali dalam transaksi dan membuat kunjungan serta antrean baru', async () => {
  const tx = {
    $queryRaw: jest.fn(),
    kunjungan: { count: jest.fn().mockResolvedValue(0), create: jest.fn().mockResolvedValue(baru), findUniqueOrThrow: jest.fn().mockResolvedValue(baru) },
    antrean: { aggregate: jest.fn().mockResolvedValue({ _max: { nomor: null } }), create: jest.fn() },
  };
  jest.mocked(prisma.$transaction).mockImplementation(async (fn: unknown) => (fn as (client: unknown) => Promise<unknown>)(tx) as never);
  const hasil = await repo.daftarkan(7, 4, data, waktu);
  expect(tx.kunjungan.count).toHaveBeenCalledWith({ where: expect.objectContaining(filter) });
  expect(tx.kunjungan.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ pasien_id: 10, mulai: waktu }) }));
  expect(tx.antrean.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ kunjungan_id: 22, tanggal: new Date('2026-10-29T00:00:00Z'), nomor: 1 }) }));
  expect(hasil).toMatchObject({ id: 22, pasien_id: 10, antrean: { status: 'menunggu' } });
});

test('kunjungan aktif tetap menolak pendaftaran ganda di dalam transaksi', async () => {
  const tx = { $queryRaw: jest.fn(), kunjungan: { count: jest.fn().mockResolvedValue(1), create: jest.fn() } };
  jest.mocked(prisma.$transaction).mockImplementation(async (fn: unknown) => (fn as (client: unknown) => Promise<unknown>)(tx) as never);
  await expect(repo.daftarkan(7, 4, data, waktu)).rejects.toBeInstanceOf(KunjunganBerjalanError);
  expect(tx.kunjungan.create).not.toHaveBeenCalled();
});
