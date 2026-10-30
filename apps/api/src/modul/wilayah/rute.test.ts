import express from 'express';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { PenggunaSaya } from '@klira/shared';
import type { LayananAkses } from '../akses/layanan';
import type { LayananIzin } from '../akses/layanan-izin';
import type { LayananPasien } from '../pasien/layanan';
import { buatRutePasien } from '../pasien/rute';

let server: Server;
const pengguna = (aksi: 'input' | 'perbaikan' | 'lihat' | null): PenggunaSaya => ({
  id: 1, nama: 'Uji', username: 'uji', fasyankes_id: 7, wajib_ganti_kredensial: false,
  jenis_akun: [], fitur: ['pasien'], halaman_awal: '/pasien', izin: aksi ? [{ fitur: 'pasien', aksi, cakupan: 'layanan' }] : [],
});
beforeAll(() => {
  const akses = { saya: async (sesi?: string) => sesi === 'tanpa-izin' ? pengguna(null) : sesi === 'input' || sesi === 'perbaikan' || sesi === 'lihat' ? pengguna(sesi) : null } as LayananAkses;
  const izin = { catatPenolakan: async () => {}, catatTindakan: async () => [] } as unknown as LayananIzin;
  const app = express().use(buatRutePasien(akses, izin, {} as LayananPasien));
  return new Promise<void>((resolve, reject) => { server = app.listen(0, '127.0.0.1', (e?: Error) => e ? reject(e) : resolve()); });
});
afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));
const ambil = (jalur: string, sesi?: string) => fetch(`http://127.0.0.1:${(server.address() as AddressInfo).port}${jalur}`, { headers: sesi ? { cookie: `klira_sesi=${sesi}` } : {} });
test('referensi dilindungi sesi dan izin pasien, tanpa perlu izin master', async () => {
  expect((await ambil('/wilayah?cari=dago')).status).toBe(401);
  expect((await ambil('/wilayah?cari=dago', 'tanpa-izin')).status).toBe(403);
  for (const sesi of ['input', 'perbaikan', 'lihat']) {
    const res = await ambil('/wilayah?cari=keude%20bakongan', sesi);
    expect(res.status).toBe(200);
    const h = await res.json();
    expect(h.data.data[0].label).toContain('Kabupaten Aceh Selatan');
  }
});
test('validasi kueri, resolusi kode tersimpan, dan kode tidak dikenal', async () => {
  for (const jalur of ['/wilayah', `/wilayah?cari=${'a'.repeat(101)}`, '/wilayah?cari=a&cari=b']) expect((await ambil(jalur, 'input')).status).toBe(400);
  const res = await ambil('/wilayah/11.01.01.2001', 'perbaikan');
  expect(res.status).toBe(200);
  expect((await res.json()).data.nama).toBe('Keude Bakongan');
  expect((await ambil('/wilayah/99.01.01.2001', 'lihat')).status).toBe(404);
  expect((await ambil('/wilayah/constructor', 'lihat')).status).toBe(404);
});
