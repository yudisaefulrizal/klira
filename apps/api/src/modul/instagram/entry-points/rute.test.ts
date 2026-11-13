import * as db from '@klira/db';
import express from 'express';
import type { AddressInfo } from 'node:net';
import type { PenggunaSaya } from '@klira/shared';
import type { LayananAkses } from '../../akses/domain/layanan';
import type { LayananIzin } from '../../akses/domain/layanan-izin';

import { buatRuteInstagram } from './rute';
jest.mock('../domain/meta', () => ({ ...jest.requireActual('../domain/meta'), metaTersedia: () => false }));
jest.mock('@klira/db', () => {
  const ambilIgKoneksi = jest.fn();
  const cariIgPercakapanUntukBuatRuteInstagram = jest.fn();
  const kunci = jest.fn();
  return { ...jest.requireActual('@klira/db'),
pool: {},
ambilIgKoneksi: ambilIgKoneksi,
cariIgPercakapanUntukBuatRuteInstagram: cariIgPercakapanUntukBuatRuteInstagram,
transaksi: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn({})),
hitungIgPercakapanBelumDibaca: kunci,
enkripsiRahasia: jest.fn((v) => v),
dekripsiRahasia: jest.fn((v) => v) };
});
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
  expect(db.ambilIgKoneksi).not.toHaveBeenCalled();
});
it('tidak membocorkan kunci dan identitas akun fasyankes lain', async () => {
  jest.mocked(db.ambilIgKoneksi).mockResolvedValue({ fasyankes_id: 20, status: 'terhubung', username: 'rahasia', api_key: 'secret' } as never);
  const data = await (await fetch(`${url}/koneksi`)).json();
  expect(data.data).toEqual({ status: 'terputus', nomor: null, qr: null, tersedia: false, dikonfigurasi: false, token_berakhir: null });
});
it('membatasi percakapan dan media ke fasyankes peminta', async () => {
  jest.mocked(db.cariIgPercakapanUntukBuatRuteInstagram).mockResolvedValue(null);
  expect((await fetch(`${url}/percakapan/99/pesan`)).status).toBe(404);
  expect(jest.mocked(db.cariIgPercakapanUntukBuatRuteInstagram).mock.calls.map(args => ({ ...args }))).toEqual(expect.arrayContaining([expect.objectContaining({ 0: 99, 1: 10 })]));
});
it('menolak endpoint koneksi lama yang melewati login Meta', async () => {
  jest.mocked(db.ambilIgKoneksi).mockResolvedValue({ fasyankes_id: 10, akun_id: 'pertama' } as never);
  const res = await fetch(`${url}/koneksi`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ aksi: 'hubungkan', akun_id: 'kedua', api_key: 'kunci-uji-cukup-panjang' }) });
  expect(res.status).toBe(400);
});
