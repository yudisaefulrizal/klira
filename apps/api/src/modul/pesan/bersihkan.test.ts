import express from 'express';
import type { AddressInfo } from 'node:net';
import type { PenggunaSaya } from '@klira/shared';
import { prisma } from '@klira/db';
import { buatRuteWhatsapp } from '../whatsapp/rute';
import { buatRuteInstagram } from '../instagram/rute';
import type { LayananAkses } from '../akses/layanan';
import type { LayananIzin } from '../akses/layanan-izin';
import { dengarkanWhatsapp } from '../whatsapp/kanal';
import { dengarkanInstagram } from '../instagram/kanal';

jest.mock('@klira/db', () => {
  const model = () => ({ count: jest.fn(), deleteMany: jest.fn(), findMany: jest.fn() });
  const p = { $transaction: jest.fn(), $queryRaw: jest.fn(), waBaca: model(), waPesan: model(), waPercakapan: model(), waMedia: model(), igBaca: model(), igPesan: model(), igPercakapan: model(), igMedia: model(), igMediaPublik: model(), waKoneksi: { findUnique: jest.fn(), update: jest.fn() }, igKoneksi: { findUnique: jest.fn(), update: jest.fn() }, waAuth: model(), igOauthState: model(), logAudit: { create: jest.fn() } };
  return { prisma: p };
});
let user: PenggunaSaya | null;
const akses = { saya: async () => user } as unknown as LayananAkses;
const izin = { catatPenolakan: async () => {}, catatTindakan: async () => {} } as unknown as LayananIzin;
const app = express();
app.use(express.json());
app.use('/api', buatRuteWhatsapp(akses, izin), buatRuteInstagram(akses, izin));
app.use((_e: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => { void _next; res.status(500).json({ galat: { pesan: 'Gagal' } }); });
let server: ReturnType<typeof app.listen>;
let url: string;
beforeAll(async () => {
  await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => r()); });
  url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
});
afterAll(async () => { await new Promise<void>((r) => server.close(() => r())); });
beforeEach(() => {
  jest.clearAllMocks();
  user = { id: 7, fasyankes_id: 10, izin: [{ fitur: 'whatsapp', aksi: 'lihat', cakupan: 'unit' }, { fitur: 'instagram', aksi: 'lihat', cakupan: 'unit' }] } as PenggunaSaya;
  jest.mocked(prisma.$transaction).mockImplementation((async (fn: (tx: typeof prisma) => Promise<unknown>) => fn(prisma)) as never);
  for (const m of [prisma.waBaca, prisma.waPesan, prisma.waPercakapan, prisma.waMedia, prisma.igBaca, prisma.igPesan, prisma.igPercakapan, prisma.igMedia, prisma.igMediaPublik]) jest.mocked(m.deleteMany).mockResolvedValue({ count: 2 });
  jest.mocked(prisma.waKoneksi.findUnique).mockResolvedValue({ id: 1, fasyankes_id: 10, aktif: true } as never);
  jest.mocked(prisma.igKoneksi.findUnique).mockResolvedValue({ id: 1, fasyankes_id: 10, aktif: true } as never);
  jest.mocked(prisma.waPesan.count).mockResolvedValue(0);
  jest.mocked(prisma.igPesan.count).mockResolvedValue(0);
  jest.mocked(prisma.igMedia.findMany).mockResolvedValue([{ id: 'media-fas-10' }] as never);
  jest.mocked(prisma.logAudit.create).mockResolvedValue({} as never);
});
const clean = (kanal: string, body: unknown = { konfirmasi: kanal }) => fetch(`${url}/${kanal}/percakapan`, { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

it.each(['whatsapp', 'instagram'])('%s: perlu sesi, izin kanal, dan konfirmasi tepat', async (kanal) => {
  user = null; expect((await clean(kanal)).status).toBe(401);
  user = { id: 7, fasyankes_id: 10, izin: [] } as unknown as PenggunaSaya;
  expect((await clean(kanal)).status).toBe(403);
  user.izin = [{ fitur: kanal, aksi: 'lihat', cakupan: 'unit' }];
  expect((await clean(kanal, {})).status).toBe(400);
  expect((await clean(kanal, { konfirmasi: 'kanal-lain' })).status).toBe(400);
  expect(prisma.$transaction).not.toHaveBeenCalled();
});

it.each(['whatsapp', 'instagram'])('%s: hapus lokal hanya fasyankes peminta dan kabarkan setelah sukses', async (kanal) => {
  const events: unknown[] = [];
  const stop = kanal === 'whatsapp' ? dengarkanWhatsapp((e) => events.push(e)) : dengarkanInstagram((e) => events.push(e));
  try {
    const res = await clean(kanal); expect(res.status).toBe(200);
    expect((await res.json()).data).toEqual({ percakapan: 2, pesan: 2 });
    const pesan = kanal === 'whatsapp' ? prisma.waPesan : prisma.igPesan;
    const percakapan = kanal === 'whatsapp' ? prisma.waPercakapan : prisma.igPercakapan;
    expect(pesan.deleteMany).toHaveBeenCalledWith({ where: { percakapan: { fasyankes_id: 10 } } });
    expect(percakapan.deleteMany).toHaveBeenCalledWith({ where: { fasyankes_id: 10 } });
    expect((kanal === 'whatsapp' ? prisma.igPesan : prisma.waPesan).deleteMany).not.toHaveBeenCalled();
    expect(prisma.logAudit.create).toHaveBeenCalledWith({ data: expect.objectContaining({ fasyankes_id: 10, pengguna_id: 7, aksi: 'perbaikan' }) });
    expect(events).toEqual([{ tipe: 'dibersihkan', fasyankes_id: 10 }]);
    if (kanal === 'instagram') expect(prisma.igMediaPublik.deleteMany).toHaveBeenCalledWith({ where: { media_id: { in: ['media-fas-10'] } } });
  } finally { stop(); }
});

it.each(['whatsapp', 'instagram'])('%s: pengiriman berjalan menolak clean sebelum penghapusan', async (kanal) => {
  const pesan = kanal === 'whatsapp' ? prisma.waPesan : prisma.igPesan;
  jest.mocked(pesan.count).mockResolvedValue(1);
  expect((await clean(kanal)).status).toBe(409);
  expect(pesan.deleteMany).not.toHaveBeenCalled();
  expect(prisma.logAudit.create).not.toHaveBeenCalled();
});

it('gagal audit membatalkan transaksi dan tidak menyiarkan keberhasilan', async () => {
  const events: unknown[] = [];
  const stop = dengarkanWhatsapp((e) => events.push(e));
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  try {
    jest.mocked(prisma.logAudit.create).mockRejectedValueOnce(new Error('audit unavailable'));
    expect((await clean('whatsapp')).status).toBe(500);
    expect(events).toEqual([]);
  } finally { stop(); consoleSpy.mockRestore(); }
});


it.each(['whatsapp', 'instagram'])('%s: Keluar menghapus seluruh pesan termasuk antrean dan identitas lama', async (kanal) => {
  jest.mocked(prisma.waPesan.count).mockResolvedValue(1);
  jest.mocked(prisma.igPesan.count).mockResolvedValue(1);
  const res = await fetch(`${url}/${kanal}/koneksi`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ aksi: 'putuskan' }) });
  expect(res.status).toBe(200);
  const koneksi = kanal === 'whatsapp' ? prisma.waKoneksi : prisma.igKoneksi;
  const percakapan = kanal === 'whatsapp' ? prisma.waPercakapan : prisma.igPercakapan;
  expect(koneksi.update).toHaveBeenCalledWith({ where: { id: 1, fasyankes_id: 10 }, data: expect.objectContaining({ aktif: false, status: 'terputus', generasi: { increment: 1 }, ...(kanal === 'whatsapp' ? { nomor: null, qr: null } : { username: '', akun_id: '', access_token: null }) }) });
  expect(percakapan.deleteMany).toHaveBeenCalledWith({ where: { fasyankes_id: 10 } });
  expect((kanal === 'whatsapp' ? prisma.igPercakapan : prisma.waPercakapan).deleteMany).not.toHaveBeenCalled();
});

it.each(['whatsapp', 'instagram'])('%s: koneksi tidak aktif menyembunyikan identitas lama', async (kanal) => {
  const koneksi = kanal === 'whatsapp' ? prisma.waKoneksi : prisma.igKoneksi;
  jest.mocked(koneksi.findUnique).mockResolvedValue({ id: 1, fasyankes_id: 10, aktif: false, nomor: '628111111111', username: 'akun-lama', detak: new Date(), status: 'terhubung', token_berakhir: new Date(Date.now() + 60000) } as never);
  const res = await fetch(`${url}/${kanal}/koneksi`);
  expect((await res.json()).data).toMatchObject({ nomor: null, status: 'terputus', tersedia: false });
});
