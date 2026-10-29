import express from 'express';
import type { AddressInfo } from 'node:net';
import type { PenggunaSaya } from '@klira/shared';
import type { LayananAkses } from '../akses/layanan';
import type { LayananIzin } from '../akses/layanan-izin';
import { prisma } from '@klira/db';
import { buatRuteWhatsapp } from './rute';
jest.mock('@klira/db', () => ({
  prisma: {
    waPercakapan: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    waKoneksi: { findUnique: jest.fn(), upsert: jest.fn() },
    waMedia: { findFirst: jest.fn() },
    waPesan: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), updateMany: jest.fn() },
    waBaca: { upsert: jest.fn(), updateMany: jest.fn() },
    $transaction: jest.fn(),
    pasien: { findFirst: jest.fn() },
    pengguna: { findFirst: jest.fn() },
  },
  kunciPercakapanWhatsapp: jest.fn(async () => {}),
  pangkasPesanWhatsapp: jest.fn(async () => {}),
  rapikanRiwayatWhatsapp: jest.fn(async () => {}),
  dekripsiRahasia: jest.fn((v) => v),
  enkripsiRahasia: jest.fn((v) => v),
}));
jest.mock('../../middleware/audit', () => ({
  buatFasilitasAudit: () => ({
    perbaikan: () => (_req: unknown, _res: unknown, next: () => void) => next(),
    lihat: () => (_req: unknown, _res: unknown, next: () => void) => next(),
  }),
}));
let user: PenggunaSaya | null;
const akses = { saya: jest.fn(async () => user) } as unknown as LayananAkses;
const izin = {
  catatPenolakan: jest.fn(async () => {}),
  catatTindakan: jest.fn(async () => {}),
} as unknown as LayananIzin;
const app = express();
app.use(express.json());
app.use('/api', buatRuteWhatsapp(akses, izin));
const server = app.listen(0, '127.0.0.1');
let port: number;
beforeAll(async () => {
  if (!server.listening)
    await new Promise<void>((resolve, reject) => {
      server.once('listening', resolve);
      server.once('error', reject);
    });
  port = (server.address() as AddressInfo).port;
});
const call = (jalur: string, body?: unknown, headers: Record<string, string> = {}) =>
  fetch(`http://127.0.0.1:${port}/api/whatsapp${jalur}`, {
    method: body ? 'POST' : 'GET',
    headers: { 'content-type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
beforeEach(() => {
  jest.clearAllMocks();
  user = {
    id: 7,
    fasyankes_id: 2,
    izin: [{ fitur: 'whatsapp', aksi: 'lihat', cakupan: 'unit' }],
  } as PenggunaSaya;
});
afterAll(() => server.close());
it('menolak pengguna tanpa sesi dan tanpa izin', async () => {
  user = null;
  expect((await call('/ringkasan')).status).toBe(401);
  user = { id: 7, fasyankes_id: 2, izin: [] } as unknown as PenggunaSaya;
  expect((await call('/ringkasan')).status).toBe(403);
});
it('membatasi percakapan ke fasyankes pengguna', async () => {
  jest.mocked(prisma.waPercakapan.findFirst).mockResolvedValue(null);
  expect((await call('/percakapan/99/pesan')).status).toBe(404);
  expect(prisma.waPercakapan.findFirst).toHaveBeenCalledWith({ where: { id: 99, fasyankes_id: 2 } });
});
it('satu izin WhatsApp memberi akses pengelolaan koneksi', async () => {
  jest.mocked(prisma.waKoneksi.findUnique).mockResolvedValue({ fasyankes_id: 2 } as never);
  expect((await call('/koneksi', { aksi: 'hubungkan' })).status).toBe(200);
  expect(prisma.waKoneksi.upsert).toHaveBeenCalled();
});
it('satu izin WhatsApp dapat melihat QR', async () => {
  jest
    .mocked(prisma.waKoneksi.findUnique)
    .mockResolvedValue({ fasyankes_id: 2, detak: new Date(), status: 'qr', qr: 'qr-uji', nomor: null } as never);
  const response = await call('/koneksi');
  expect(response.status).toBe(200);
  expect((await response.json()).data.qr).toBe('qr-uji');
});
it('menolak pengiriman saat koneksi tidak aktif', async () => {
  jest
    .mocked(prisma.waPercakapan.findFirst)
    .mockResolvedValue({ id: 3, fasyankes_id: 2, jid: '6281234567890@s.whatsapp.net' } as never);
  jest.mocked(prisma.waKoneksi.findUnique).mockResolvedValue(null);
  expect((await call('/percakapan/3/pesan', { teks: 'halo' })).status).toBe(409);
});
it('menolak penautan nomor yang sudah menjadi milik pasien lain', async () => {
  user!.izin.push({ fitur: 'pasien', aksi: 'lihat', cakupan: 'unit' });
  jest.mocked(prisma.pasien.findFirst).mockResolvedValue({ id: 5, nama: 'Pasien' } as never);
  jest.mocked(prisma.waPercakapan.findUnique).mockResolvedValue({ pasien_id: 9 } as never);
  expect((await call('/percakapan', { nomor: '081234567890', pasien_id: 5 })).status).toBe(409);
  expect(prisma.waPercakapan.upsert).not.toHaveBeenCalled();
});

it('mengantrekan balasan dalam transaksi, tanpa mengirim dari proses API', async () => {
  jest
    .mocked(prisma.waPercakapan.findFirst)
    .mockResolvedValue({ id: 3, fasyankes_id: 2, jid: '6281234567890@s.whatsapp.net' } as never);
  jest
    .mocked(prisma.waKoneksi.findUnique)
    .mockResolvedValue({ fasyankes_id: 2, aktif: true, status: 'terhubung', detak: new Date() } as never);
  jest.mocked(prisma.waPesan.create).mockResolvedValue({ id: 40 } as never);
  (prisma.$transaction as unknown as jest.Mock).mockImplementation(
    (callback: (tx: typeof prisma) => Promise<unknown>) => callback(prisma),
  );
  expect((await call('/percakapan/3/pesan', { teks: 'halo' })).status).toBe(201);
  expect(prisma.waPesan.create).toHaveBeenCalledWith({
    data: expect.objectContaining({ percakapan_id: 3, status: 'antre', arah: 'keluar', dibuat_oleh: 7 }),
  });
});
it('penanda baca hanya bergerak maju sampai pesan yang benar-benar dibuka', async () => {
  jest
    .mocked(prisma.waPercakapan.findFirst)
    .mockResolvedValue({ id: 3, fasyankes_id: 2, jid: '6281234567890@s.whatsapp.net' } as never);
  jest.mocked(prisma.waPesan.findFirst).mockResolvedValue({ id: 40, percakapan_id: 3 } as never);
  expect((await call('/percakapan/3/baca', { pesan_id: 40 })).status).toBe(200);
  expect(prisma.waBaca.updateMany).toHaveBeenCalledWith({
    where: { percakapan_id: 3, pengguna_id: 7, pesan_id: { lt: 40 } },
    data: { pesan_id: 40 },
  });
});
it('memutuskan koneksi membatalkan antrean milik fasyankes itu saja', async () => {
  jest.mocked(prisma.waKoneksi.findUnique).mockResolvedValue({ fasyankes_id: 2 } as never);
  expect((await call('/koneksi', { aksi: 'putuskan' })).status).toBe(200);
  expect(prisma.waPesan.updateMany).toHaveBeenCalledWith({
    where: { status: 'antre', percakapan: { fasyankes_id: 2 } },
    data: { status: 'dibatalkan' },
  });
});

it('izin inbox saja tidak boleh mengambil identitas pasien melalui penautan', async () => {
  expect((await call('/percakapan', { nomor: '081234567890', pasien_id: 5 })).status).toBe(403);
  expect(prisma.pasien.findFirst).not.toHaveBeenCalled();
});

it('menolak akses langsung serta balasan pada percakapan grup', async () => {
  jest.mocked(prisma.waPercakapan.findFirst).mockResolvedValue({ id: 3, fasyankes_id: 2, jid: '123456@g.us' } as never);
  expect((await call('/percakapan/3/pesan')).status).toBe(404);
  expect((await call('/percakapan/3/pesan', { teks: 'halo' })).status).toBe(404);
  expect(prisma.waPesan.create).not.toHaveBeenCalled();
});

describe('pratinjau lampiran terautentikasi', () => {
  beforeEach(() => {
    jest.mocked(prisma.waMedia.findFirst).mockResolvedValue({
      id: 'media-uji',
      fasyankes_id: 2,
      mime: 'video/mp4',
      nama: 'video.mp4',
      isi: Buffer.from('abcdef').toString('base64'),
    } as never);
  });
  it('tetap mengunduh secara bawaan dan hanya mengizinkan pratinjau media yang dikenal', async () => {
    const unduh = await call('/media/media-uji');
    expect(unduh.headers.get('content-disposition')).toContain('attachment');
    const preview = await call('/media/media-uji?pratinjau=1');
    expect(preview.headers.get('content-type')).toContain('video/mp4');
    expect(preview.headers.get('content-disposition')).toBe('inline');
    expect(await preview.text()).toBe('abcdef');
    expect(prisma.waMedia.findFirst).toHaveBeenCalledWith({ where: { id: 'media-uji', fasyankes_id: 2 } });
  });
  it('mendukung range agar video dapat diputar dan digeser', async () => {
    const response = await call('/media/media-uji?pratinjau=1', undefined, { range: 'bytes=1-3' });
    expect(response.status).toBe(206);
    expect(response.headers.get('content-range')).toBe('bytes 1-3/6');
    expect(await response.text()).toBe('bcd');
    const suffix = await call('/media/media-uji?pratinjau=1', undefined, { range: 'bytes=-2' });
    expect(await suffix.text()).toBe('ef');
    expect((await call('/media/media-uji?pratinjau=1', undefined, { range: 'bytes=99-' })).status).toBe(416);
  });
  it('HTML tetap menjadi unduhan dan sesi wajib tersedia', async () => {
    jest.mocked(prisma.waMedia.findFirst).mockResolvedValue({
      id: 'media-uji',
      mime: 'text/html',
      nama: 'dokumen.html',
      isi: Buffer.from('abc').toString('base64'),
    } as never);
    const response = await call('/media/media-uji?pratinjau=1');
    expect(response.headers.get('content-disposition')).toContain('attachment');
    user = null;
    expect((await call('/media/media-uji?pratinjau=1')).status).toBe(401);
  });
});

it('membatasi riwayat API menjadi sepuluh pesan terakhir', async () => {
  jest
    .mocked(prisma.waPercakapan.findFirst)
    .mockResolvedValue({ id: 3, fasyankes_id: 2, jid: '6281234567890@s.whatsapp.net' } as never);
  jest.mocked(prisma.waPesan.findMany).mockResolvedValue([]);
  expect((await call('/percakapan/3/pesan?sebelum=999')).status).toBe(200);
  expect(prisma.waPesan.findMany).toHaveBeenCalledWith({
    where: { percakapan_id: 3 },
    orderBy: { id: 'desc' },
    take: 10,
  });
});

describe('informasi kontak dan penautan pasien', () => {
  beforeEach(() => {
    jest
      .mocked(prisma.waPercakapan.findFirst)
      .mockResolvedValue({
        id: 3,
        fasyankes_id: 2,
        jid: '6281234567890@s.whatsapp.net',
        pasien_id: 5,
        penanggung_jawab: null,
      } as never);
  });
  const patch = (body: unknown) =>
    fetch(`http://127.0.0.1:${port}/api/whatsapp/percakapan/3`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  it('menyembunyikan identitas pasien jika hanya memiliki izin WhatsApp', async () => {
    const res = await call('/percakapan/3/info');
    expect(res.status).toBe(200);
    expect((await res.json()).data).toEqual({ pasien_tertaut: true, pasien: null, penanggung: null });
    expect(prisma.pasien.findFirst).not.toHaveBeenCalled();
    expect((await patch({ pasien_id: 5 })).status).toBe(403);
  });
  it('hanya membaca identitas pasien pada fasyankes yang sama', async () => {
    user!.izin.push({ fitur: 'pasien', aksi: 'lihat', cakupan: 'unit' });
    jest.mocked(prisma.pasien.findFirst).mockResolvedValue({ id: 5, nama: 'Pasien uji', nomor_rm: 'RM005' } as never);
    expect((await call('/percakapan/3/info')).status).toBe(200);
    expect(prisma.pasien.findFirst).toHaveBeenCalledWith({
      where: { id: 5, fasyankes_id: 2 },
      select: { id: true, nama: true, nomor_rm: true },
    });
  });
  it('menautkan dengan pembatas agar tautan pasien lain tidak tertimpa', async () => {
    user!.izin.push({ fitur: 'pasien', aksi: 'lihat', cakupan: 'unit' });
    jest.mocked(prisma.pasien.findFirst).mockResolvedValue({ id: 5 } as never);
    jest.mocked(prisma.waPercakapan.updateMany).mockResolvedValue({ count: 1 });
    expect((await patch({ pasien_id: 5 })).status).toBe(200);
    expect(prisma.waPercakapan.updateMany).toHaveBeenCalledWith({
      where: { id: 3, OR: [{ pasien_id: null }, { pasien_id: 5 }] },
      data: { pasien_id: 5 },
    });
    jest.mocked(prisma.waPercakapan.updateMany).mockResolvedValue({ count: 0 });
    expect((await patch({ pasien_id: 5 })).status).toBe(409);
  });
});

describe('kontak WhatsApp dari data pasien', () => {
  it('menyediakan nomor pasien dan kontak wali secara terpisah', async () => {
    user!.izin.push({ fitur: 'pasien', aksi: 'lihat', cakupan: 'unit' });
    const pasien = { id: 5, nama: 'Ayu', nomor_hp: '6281234567890', wali_keluarga: [{ nama: 'Budi', hubungan: 'Ayah', kontak: '089999999999' }] };
    jest.mocked(prisma.pasien.findFirst).mockResolvedValue(pasien as never);
    const res = await call('/pasien/5');
    expect(res.status).toBe(200); expect((await res.json()).data).toEqual(pasien);
    expect(prisma.pasien.findFirst).toHaveBeenCalledWith({
      where: { id: 5, fasyankes_id: 2 },
      select: { id: true, nama: true, nomor_hp: true, wali_keluarga: { select: { nama: true, hubungan: true, kontak: true } } },
    });
  });
  it('tetap menyediakan kontak wali ketika nomor pasien kosong', async () => {
    user!.izin.push({ fitur: 'pasien', aksi: 'lihat', cakupan: 'unit' });
    jest.mocked(prisma.pasien.findFirst).mockResolvedValue({ id: 5, nama: 'Ayu', nomor_hp: null, wali_keluarga: [] } as never);
    expect((await (await call('/pasien/5')).json()).data.nomor_hp).toBeNull();
  });
  it('menolak tanpa izin pasien dan tidak membocorkan pasien lintas fasyankes', async () => {
    expect((await call('/pasien/5')).status).toBe(403); expect(prisma.pasien.findFirst).not.toHaveBeenCalled();
    user!.izin.push({ fitur: 'pasien', aksi: 'lihat', cakupan: 'unit' });
    jest.mocked(prisma.pasien.findFirst).mockResolvedValue(null);
    expect((await call('/pasien/5')).status).toBe(404);
  });
});
