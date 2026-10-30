import express from 'express';
import type { Server } from 'http';
import type { AddressInfo } from 'net';
import type { PenggunaSaya } from '@klira/shared';
import { buatRuteFarmasi } from './rute';
import { buatRuteKasirLengkap } from '../kasir/rute-kasir';
import type { LayananAkses } from '../akses/layanan';
import type { LayananIzin } from '../akses/layanan-izin';
import type { LayananFarmasi } from './layanan';
import type { LayananKasir } from '../kasir/layanan-kasir';

let server: Server;
const serahTerima = jest.fn().mockResolvedValue({ ok: true, data: { resep: [], kekurangan: [] } });
const bayar = jest.fn().mockResolvedValue({ ok: true, data: {} });
const resepKunjungan = jest.fn().mockResolvedValue({ ok: true, data: [] });
const akses = {
  saya: async (sesi?: string) => sesi ? ({ id: 8, fasyankes_id: 4, izin: [{ fitur: sesi, aksi: 'input', cakupan: 'unit' }] } as PenggunaSaya) : null,
} as LayananAkses;
const izin = { catatPenolakan: jest.fn().mockResolvedValue(undefined), catatTindakan: jest.fn().mockResolvedValue(undefined) } as unknown as LayananIzin;
beforeAll(() => new Promise<void>((resolve, reject) => {
  const app = express(); app.use(express.json());
  app.use(buatRuteKasirLengkap(akses, izin, { bayar } as unknown as LayananKasir));
  app.use(buatRuteFarmasi(akses, izin, { serahTerima, resepKunjungan } as unknown as LayananFarmasi));
  server = app.listen(0, '127.0.0.1', (error?: Error) => { if (error) reject(error); else resolve(); });
}));
afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));
beforeEach(() => jest.clearAllMocks());
async function panggil(jalur: string, fitur?: string, badan: unknown = {}) {
  return fetch(`http://127.0.0.1:${(server.address() as AddressInfo).port}${jalur}`, {
    method: 'POST', headers: { 'content-type': 'application/json', ...(fitur ? { cookie: `klira_sesi=${fitur}` } : {}) }, body: JSON.stringify(badan),
  });
}
test('penyerahan memerlukan sesi dan izin farmasi; izin kasir saja tidak cukup', async () => {
  expect((await panggil('/kunjungan/12/serah-terima-obat')).status).toBe(401);
  expect((await panggil('/kunjungan/12/serah-terima-obat', 'kasir')).status).toBe(403);
  expect(serahTerima).not.toHaveBeenCalled();
  expect((await panggil('/kunjungan/12/serah-terima-obat', 'farmasi')).status).toBe(200);
  expect(serahTerima).toHaveBeenCalledWith(expect.objectContaining({ id: 8, fasyankes_id: 4 }), 12, { izinkan_stok_kurang: false }, expect.any(String));
  expect(bayar).not.toHaveBeenCalled();
});
test('izin farmasi tidak memberi akses mencatat pembayaran', async () => {
  expect((await panggil('/kunjungan/12/pembayaran', 'farmasi', { metode: 'tunai', jumlah: 5000 })).status).toBe(403);
  expect(bayar).not.toHaveBeenCalled();
  expect((await panggil('/kunjungan/12/pembayaran', 'kasir', { metode: 'tunai', jumlah: 5000 })).status).toBe(201);
  expect(serahTerima).not.toHaveBeenCalled();
});
test('penyerahan menolak stok override tanpa alasan dan id tidak sah sebelum layanan', async () => {
  expect((await panggil('/kunjungan/12/serah-terima-obat', 'farmasi', { izinkan_stok_kurang: true })).status).toBe(400);
  expect((await panggil('/kunjungan/abc/serah-terima-obat', 'farmasi')).status).toBe(404);
  expect(serahTerima).not.toHaveBeenCalled();
});
