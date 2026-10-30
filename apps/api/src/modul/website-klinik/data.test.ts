import { prisma } from '@klira/db';
import { WEBSITE_KLINIK_BAWAAN, tanggalWib } from '@klira/shared';
import { bacaKlinikPublik, pengaturanWebsite } from './data';
jest.mock('@klira/db', () => ({ prisma: { websiteKlinik: { findFirst: jest.fn(), findMany: jest.fn(), count: jest.fn() }, fasyankes: { findUnique: jest.fn() }, lokasi: { findMany: jest.fn() }, jadwalPraktik: { findMany: jest.fn() } } }));
const web = { ...WEBSITE_KLINIK_BAWAAN, aktif: true, slug: 'klinik-a', domain: 'klinik.example', fasyankes_id: 7, fasyankes: { nama: 'Klinik A' } };
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(prisma.websiteKlinik.findFirst).mockResolvedValue(web as never);
  jest.mocked(prisma.websiteKlinik.findMany).mockResolvedValue([]);
  jest.mocked(prisma.websiteKlinik.count).mockResolvedValue(0);
  jest.mocked(prisma.lokasi.findMany).mockResolvedValue([{ id: 3, nama: 'Poli Umum' }] as never);
  jest.mocked(prisma.jadwalPraktik.findMany).mockResolvedValue([{ hari: 4, jam_mulai: '08:00', jam_selesai: '12:00', lokasi_id: 3, pengguna: { nama: 'Nama internal' } }] as never);
});
test('domain memilih website aktif, query layanan dan jadwal terisolasi, identitas internal tidak dikirim', async () => {
  const data = await bacaKlinikPublik('KLINIK.EXAMPLE');
  expect(data?.nama).toBe('Klinik A'); expect(data?.jadwal[0].praktisi).toBeNull();
  expect(prisma.websiteKlinik.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { aktif: true, domain: 'klinik.example' } }));
  expect(prisma.lokasi.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { fasyankes_id: 7, jenis: 'poli', status_operasional: 'O' } }));
  expect(prisma.jadwalPraktik.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ fasyankes_id: 7, lokasi_id: { in: [3] }, aktif: true, berlaku_dari: { lte: new Date(`${tanggalWib(new Date())}T00:00:00Z`) } }) }));
  expect(JSON.stringify(data)).not.toMatch(/fasyankes_id|pengguna_id|nomor_sip|Nama internal|nomor_rm|tampilkan_nama/);
});
test('slug hanya membaca profil terpublikasi yang diminta; slug tidak ada tidak memakai fallback klinik lain', async () => {
  jest.mocked(prisma.websiteKlinik.findFirst).mockResolvedValue(null);
  expect(await bacaKlinikPublik('klinik.example', 'tidak-ada')).toBeNull();
  expect(prisma.websiteKlinik.findMany).not.toHaveBeenCalled();
  expect(prisma.websiteKlinik.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { aktif: true, slug: 'tidak-ada' } }));
});
test('root otomatis hanya untuk satu profil tanpa domain; banyak profil tidak dipilih sembarang', async () => {
  jest.mocked(prisma.websiteKlinik.findFirst).mockResolvedValue(null);
  jest.mocked(prisma.websiteKlinik.findMany).mockResolvedValue([{ ...web, domain: null }] as never);
  jest.mocked(prisma.websiteKlinik.count).mockResolvedValue(1);
  expect((await bacaKlinikPublik('localhost'))?.nama).toBe('Klinik A');
  jest.mocked(prisma.websiteKlinik.count).mockResolvedValue(2);
  expect(await bacaKlinikPublik('localhost')).toBeNull();
});
test('jadwal dapat disembunyikan, nama praktisi memerlukan pengaturan publik eksplisit', async () => {
  jest.mocked(prisma.websiteKlinik.findFirst).mockResolvedValue({ ...web, tampilkan_jadwal: false } as never);
  expect((await bacaKlinikPublik('klinik.example'))?.jadwal).toEqual([]);
  expect(prisma.jadwalPraktik.findMany).not.toHaveBeenCalled();
  jest.mocked(prisma.websiteKlinik.findFirst).mockResolvedValue({ ...web, tampilkan_nama_praktisi: true } as never);
  expect((await bacaKlinikPublik('klinik.example'))?.jadwal[0].praktisi).toBe('Nama internal');
});
test('pengaturan pertama mengikuti nama fasilitas dan belum dipublikasikan', async () => {
  jest.mocked(prisma.fasyankes.findUnique).mockResolvedValue({ nama: 'Klinik B', website_klinik: null } as never);
  expect(await pengaturanWebsite(8)).toMatchObject({ nama: 'Klinik B', slug: 'klinik-8', aktif: false });
});
