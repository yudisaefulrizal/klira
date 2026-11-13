import * as db from '@klira/db';
import express from 'express';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import { WEBSITE_KLINIK_BAWAAN } from '@klira/shared';
import type { LayananAkses } from '../../akses/domain/layanan';
import type { LayananIzin } from '../../akses/domain/layanan-izin';
import { buatRuteWebsitePengaturan, buatRuteWebsitePublik } from './rute';
import { bacaKlinikPublik, pengaturanWebsite } from '../data-access/data';
jest.mock('../data-access/data', () => ({ bacaKlinikPublik: jest.fn(), pengaturanWebsite: jest.fn() }));
jest.mock('@klira/db', () => {
  const simpanWebsiteKlinikUntukBuatRuteWebsitePengaturan = jest.fn();
  const tambahRiwayatProfilUntukBuatRuteWebsitePengaturan = jest.fn();
  return { ...jest.requireActual('@klira/db'),
    pool: {},
    simpanWebsiteKlinikUntukBuatRuteWebsitePengaturan: simpanWebsiteKlinikUntukBuatRuteWebsitePengaturan,
    tambahRiwayatProfilUntukBuatRuteWebsitePengaturan: tambahRiwayatProfilUntukBuatRuteWebsitePengaturan,
    transaksi: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn({})) };
});
jest.mock('../../../middleware/audit', () => ({ alamatDari: () => '127.0.0.1', PenampungAuditMysql: class { async catat() {} } }));
jest.mock('../../../middleware/auth', () => ({ wajibMasuk: () => (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!req.headers.authorization) return void res.status(401).end();
  const aksi = req.headers.authorization === 'ubah' ? ['lihat', 'perbaikan'] : req.headers.authorization === 'lihat' ? ['lihat'] : [];
  res.locals.pengguna = { id: 3, fasyankes_id: 7, izin: aksi.map(aksi => ({ fitur: 'profil-klinik', aksi, cakupan: 'unit' })) }; next();
} }));
let server: Server;
beforeAll(() => new Promise<void>(resolve => {
  const app = express(); app.use(express.json()); app.use(buatRuteWebsitePublik());
  app.use(buatRuteWebsitePengaturan({} as LayananAkses, { catatPenolakan: async () => {}, catatTindakan: async () => {} } as unknown as LayananIzin));
  server = app.listen(0, '127.0.0.1', () => resolve());
}));
afterAll(() => new Promise<void>(resolve => server.close(() => resolve())));
beforeEach(() => {
  jest.clearAllMocks(); jest.mocked(pengaturanWebsite).mockResolvedValue({ ...WEBSITE_KLINIK_BAWAAN, nama: 'Klinik A' });
  jest.mocked(bacaKlinikPublik).mockResolvedValue(null);
});
const ambil = (path: string, auth?: string, body?: unknown) => fetch(`http://127.0.0.1:${(server.address() as AddressInfo).port}${path}`, {
  method: body ? 'PUT' : 'GET', headers: { ...(auth ? { authorization: auth } : {}), ...(body ? { 'content-type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined,
});
test('pengaturan membutuhkan login dan izin; hak baca tidak memberi hak ubah', async () => {
  expect((await ambil('/fasyankes/website')).status).toBe(401);
  expect((await ambil('/fasyankes/website', 'tanpa')).status).toBe(403);
  expect((await ambil('/fasyankes/website', 'lihat')).status).toBe(200);
  expect((await ambil('/fasyankes/website', 'lihat', WEBSITE_KLINIK_BAWAAN)).status).toBe(403);
  expect(db.simpanWebsiteKlinikUntukBuatRuteWebsitePengaturan).not.toHaveBeenCalled();
});
test('penyimpanan terikat fasilitas sesi, bukan ID dalam payload', async () => {
  const res = await ambil('/fasyankes/website', 'ubah', { ...WEBSITE_KLINIK_BAWAAN, fasyankes_id: 999 });
  expect(res.status).toBe(200);
  expect(jest.mocked(db.simpanWebsiteKlinikUntukBuatRuteWebsitePengaturan).mock.calls.map(args => ({ ...args }))).toEqual(expect.arrayContaining([expect.objectContaining({ 0: 7, 3: null })]));
  expect(jest.mocked(db.tambahRiwayatProfilUntukBuatRuteWebsitePengaturan).mock.calls.map(args => ({ ...args }))).toEqual(expect.arrayContaining([expect.objectContaining({ 0: 7, 3: 3 })]));
});
test('nilai tidak valid ditolak sebelum menulis', async () => {
  expect((await ambil('/fasyankes/website', 'ubah', { ...WEBSITE_KLINIK_BAWAAN, hero_url: 'javascript:alert(1)' })).status).toBe(400);
  expect(db.simpanWebsiteKlinikUntukBuatRuteWebsitePengaturan).not.toHaveBeenCalled();
});
test('publik tanpa login, profil tidak ada 404, dan cache tidak menyimpan profil', async () => {
  const res = await ambil('/publik/klinik/klinik-a');
  expect(res.status).toBe(404); expect(res.headers.get('cache-control')).toBe('no-store');
  expect(bacaKlinikPublik).toHaveBeenCalledWith('127.0.0.1', 'klinik-a');
});
