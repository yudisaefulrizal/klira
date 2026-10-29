import express from 'express';
import type { AddressInfo } from 'node:net';
import type { PenggunaSaya } from '@klira/shared';
import type { LayananAkses } from '../akses/layanan';
import type { LayananIzin } from '../akses/layanan-izin';
import { prisma } from '@klira/db';
import { buatRuteInstagram } from './rute';
jest.mock('./meta', () => ({ ...jest.requireActual('./meta'), metaTersedia: () => false }));
jest.mock('@klira/db', () => ({
  prisma: {
    igKoneksi: { findUnique: jest.fn() }, igPercakapan: { findFirst: jest.fn() },
  },
  enkripsiRahasia: jest.fn((v) => v), dekripsiRahasia: jest.fn((v) => v),
}));
let user: PenggunaSaya | null;
const akses = { saya: async () => user } as unknown as LayananAkses;
const izin = { catatPenolakan: async () => {}, catatTindakan: async () => {} } as unknown as LayananIzin;
const app = express(); app.use(express.json()); app.use('/api', buatRuteInstagram(akses, izin));
let server: ReturnType<typeof app.listen>; let url: string;
beforeAll(async () => {
  await new Promise<void>((resolve) => { server = app.listen(0, '127.0.0.1', () => resolve()); });
  url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/instagram`;
});
afterAll(async () => { await new Promise<void>((resolve) => server.close(() => resolve())); });
beforeEach(() => {
  jest.clearAllMocks();
  user = { id: 7, fasyankes_id: 10, izin: [{ fitur: 'instagram', aksi: 'lihat', cakupan: 'unit' }] } as PenggunaSaya;
});
it('menolak sesi kosong dan izin WhatsApp tanpa izin Instagram', async () => {
  user = null; expect((await fetch(`${url}/koneksi`)).status).toBe(401);
  user = { id: 7, fasyankes_id: 10, izin: [{ fitur: 'whatsapp', aksi: 'lihat', cakupan: 'unit' }] } as PenggunaSaya;
  expect((await fetch(`${url}/koneksi`)).status).toBe(403);
  expect(prisma.igKoneksi.findUnique).not.toHaveBeenCalled();
});
it('tidak membocorkan kunci dan identitas akun fasyankes lain', async () => {
  jest.mocked(prisma.igKoneksi.findUnique).mockResolvedValue({ fasyankes_id: 20, status: 'terhubung', username: 'rahasia', api_key: 'secret' } as never);
  const data = await (await fetch(`${url}/koneksi`)).json();
  expect(data.data).toEqual({ status: 'terputus', nomor: null, qr: null, tersedia: false, dikonfigurasi: false, token_berakhir: null });
});
it('membatasi percakapan dan media ke fasyankes peminta', async () => {
  jest.mocked(prisma.igPercakapan.findFirst).mockResolvedValue(null);
  expect((await fetch(`${url}/percakapan/99/pesan`)).status).toBe(404);
  expect(prisma.igPercakapan.findFirst).toHaveBeenCalledWith({ where: { id: 99, fasyankes_id: 10 } });
});
it('menolak endpoint koneksi lama yang melewati login Meta', async () => {
  jest.mocked(prisma.igKoneksi.findUnique).mockResolvedValue({ fasyankes_id: 10, akun_id: 'pertama' } as never);
  const res = await fetch(`${url}/koneksi`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ aksi: 'hubungkan', akun_id: 'kedua', api_key: 'kunci-uji-cukup-panjang' }) });
  expect(res.status).toBe(400);
});
