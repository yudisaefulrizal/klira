import express from 'express';
import type { Server } from 'http';
import type { AddressInfo } from 'net';
import { prisma } from '@klira/db';
import { tanggalWib } from '@klira/shared';
import { buatRuteLayarPanggilan } from './rute';
jest.mock('@klira/db', () => {
  const prisma = { fasyankes: { findUnique: jest.fn() }, lokasi: { findMany: jest.fn() }, antrean: { findMany: jest.fn() }, eventPanggilan: { findMany: jest.fn(), findFirst: jest.fn() }, $transaction: jest.fn() };
  prisma.$transaction.mockImplementation((fn: (tx: unknown) => unknown) => fn(prisma));
  return { prisma };
});
let server: Server;
beforeAll(() => new Promise<void>((resolve, reject) => {
  const app = express();
  app.use(buatRuteLayarPanggilan());
  server = app.listen(0, '127.0.0.1', (error?: Error) => {
    if (error) reject(error);
    else resolve();
  });
}));
afterAll(() => new Promise<void>(resolve => server.close(() => resolve())));
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(prisma.eventPanggilan.findMany).mockResolvedValue([]);
  jest.mocked(prisma.eventPanggilan.findFirst).mockResolvedValue(null);
});
const ambil = (id: string) => fetch(`http://127.0.0.1:${(server.address() as AddressInfo).port}/publik/layar-panggilan/${id}`);
test('alamat tidak sah ditolak sebelum membaca database', async () => {
  for (const id of ['abc', '0', '-1', '9007199254740992']) expect((await ambil(id)).status).toBe(400);
  expect(prisma.fasyankes.findUnique).not.toHaveBeenCalled();
});
test('fasilitas tidak ada menghasilkan 404', async () => {
  jest.mocked(prisma.fasyankes.findUnique).mockResolvedValue(null);
  expect((await ambil('7')).status).toBe(404);
  expect(prisma.antrean.findMany).not.toHaveBeenCalled();
});
test('publik tanpa sesi, terisolasi per fasilitas dan tanggal Jakarta, tanpa identitas pasien', async () => {
  jest.mocked(prisma.fasyankes.findUnique).mockResolvedValue({ nama: 'Klinik Uji' } as never);
  jest.mocked(prisma.lokasi.findMany).mockResolvedValue([{ id: 9, nama: 'Poli Umum' }, { id: 10, nama: 'Poli Gigi' }] as never);
  jest.mocked(prisma.antrean.findMany).mockResolvedValue([
    { id: 4, lokasi_id: 9, nomor: 23, status: 'dipanggil', waktu_panggil: new Date('2026-10-29T03:00:00Z') },
    { id: 5, lokasi_id: 9, nomor: 25, status: 'menunggu', waktu_panggil: null },
    { id: 3, lokasi_id: 9, nomor: 24, status: 'menunggu', waktu_panggil: null },
    { id: 2, lokasi_id: 10, nomor: 12, status: 'dilayani', waktu_panggil: new Date('2026-10-29T02:00:00Z') },
  ] as never);
  const res = await ambil('7');
  expect(res.status).toBe(200);
  expect(res.headers.get('cache-control')).toBe('no-store');
  const { data } = await res.json();
  expect(data.panggilan).toEqual({ kode: 'A-023', poli_id: 9, poli_nama: 'Poli Umum', waktu_panggil: '2026-10-29T03:00:00.000Z' });
  expect(data.panggilan_aktif).toEqual([data.panggilan]);
  expect(data.poli[0].berikutnya).toBe('A-024');
  expect(data.poli[1].sekarang).toEqual({ kode: 'A-012', status: 'dilayani' });
  expect(prisma.antrean.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ fasyankes_id: 7, tanggal: new Date(`${tanggalWib(new Date())}T00:00:00Z`), lokasi_id: { in: [9, 10] } }), select: { id: true, lokasi_id: true, nomor: true, status: true, waktu_panggil: true } }));
  expect(JSON.stringify(data)).not.toMatch(/pasien|nomor_rm|kunjungan_id/);
});
test('antrean kosong tetap mengembalikan poli dan status kosong', async () => {
  jest.mocked(prisma.fasyankes.findUnique).mockResolvedValue({ nama: 'Klinik Uji' } as never);
  jest.mocked(prisma.lokasi.findMany).mockResolvedValue([{ id: 9, nama: 'Poli Umum' }] as never);
  jest.mocked(prisma.antrean.findMany).mockResolvedValue([]);
  const { data } = await (await ambil('7')).json();
  expect(data.panggilan).toBeNull();
  expect(data.panggilan_aktif).toEqual([]);
  expect(data.poli).toEqual([{ id: 9, nama: 'Poli Umum', sekarang: null, berikutnya: null }]);
});

test('kursor tidak sah ditolak sebelum database dibaca', async () => {
  for (const query of ['abc', '-1', '1.5', '9007199254740992', '1&setelah=2']) expect((await ambil(`7?setelah=${query}`)).status).toBe(400);
  expect(prisma.fasyankes.findUnique).not.toHaveBeenCalled();
});
test('kunjungan pertama mendapat posisi terbaru tanpa membacakan histori lama', async () => {
  jest.mocked(prisma.eventPanggilan.findFirst).mockResolvedValue({ id: 42 } as never);
  const { data } = await (await ambil('7')).json();
  expect(data.kursor).toBe(42);
  expect(data.event_panggilan).toEqual([]);
  expect(prisma.eventPanggilan.findMany).not.toHaveBeenCalled();
});
test('event dipulihkan per fasilitas dan hari, termasuk panggil ulang dengan waktu identik', async () => {
  const waktu = new Date('2026-10-29T03:00:00Z');
  jest.mocked(prisma.eventPanggilan.findMany).mockResolvedValue([43, 44].map(id => ({ id, kode: 'A-023', poli_id: 9, poli_nama: 'Poli Umum', waktu_panggil: waktu })) as never);
  const { data } = await (await ambil('7?setelah=42')).json();
  expect(data.kursor).toBe(44);
  expect(data.event_panggilan.map((e: { event_id: number }) => e.event_id)).toEqual([43, 44]);
  expect(data.ada_lanjutan).toBe(false);
  expect(prisma.eventPanggilan.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { fasyankes_id: 7, tanggal: new Date(`${tanggalWib(new Date())}T00:00:00Z`), id: { gt: 42 } }, orderBy: { id: 'asc' }, take: 101 }));
  expect(JSON.stringify(data.event_panggilan)).not.toMatch(/pasien|nomor_rm|kunjungan/);
});
test('pemulihan bertahap mempertahankan cursor terakhir yang benar-benar dikirim', async () => {
  jest.mocked(prisma.eventPanggilan.findMany).mockResolvedValue(Array.from({ length: 101 }, (_, i) => ({ id: i + 43, kode: 'A-023', poli_id: 9, poli_nama: 'Poli Umum', waktu_panggil: new Date() })) as never);
  const { data } = await (await ambil('7?setelah=42')).json();
  expect(data.event_panggilan).toHaveLength(100);
  expect(data.kursor).toBe(142);
  expect(data.ada_lanjutan).toBe(true);
});
