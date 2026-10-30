import { filterMaster } from '@klira/shared';
import { prisma } from '@klira/db';
import { RepositoriMasterPrisma } from './repositori';
jest.mock('@klira/db', () => ({ prisma: { wilayah: { count: jest.fn(), findMany: jest.fn() } } }));

test('master wilayah membaca snapshot aplikasi tanpa tabel DB dan tetap mendukung paginasi/tingkat', async () => {
  const repo = new RepositoriMasterPrisma();
  const h = await repo.daftar(7, 'wilayah', filterMaster.parse({ tingkat: 'provinsi', cari: 'Aceh' }));
  expect(h.total).toBe(1);
  expect(h.baris[0]).toMatchObject({ kode: '11', nama: 'Aceh', induk_kode: null, contoh: false });
  const halaman = await repo.daftar(99, 'wilayah', filterMaster.parse({ tingkat: 'provinsi', halaman: 2, ukuran: 10 }));
  expect(halaman.total).toBe(38);
  expect(halaman.baris).toHaveLength(10);
  expect(prisma.wilayah.count).not.toHaveBeenCalled();
  expect(prisma.wilayah.findMany).not.toHaveBeenCalled();
});
