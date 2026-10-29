import { createHmac } from 'node:crypto';
import express from 'express';
import type { AddressInfo } from 'node:net';
import { prisma } from '@klira/db';
import type { LayananAkses } from '../akses/layanan';
import { buatRuteInstagramPublik } from './publik';
import { hash } from './meta';
jest.mock('@klira/db', () => ({ prisma: {
  $transaction: jest.fn(), $queryRaw: jest.fn(),
  igKoneksi: { findUnique: jest.fn(), findFirst: jest.fn() },
  igPenghapusan: { create: jest.fn(), findUnique: jest.fn() },
  igMediaPublik: { findUnique: jest.fn() }, igMedia: { findFirst: jest.fn() },
}, dekripsiRahasia: (v: string) => v }));
const env = { ...process.env };
const app = express(); app.use(buatRuteInstagramPublik({ saya: async () => null } as unknown as LayananAkses)); app.use(express.json());
let server: ReturnType<typeof app.listen>; let url: string;
beforeAll(async () => { await new Promise<void>((resolve) => { server = app.listen(0, '127.0.0.1', () => resolve()); }); url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`; });
afterAll(async () => { process.env = env; await new Promise<void>((resolve) => server.close(() => resolve())); });
beforeEach(() => {
  jest.clearAllMocks(); process.env.INSTAGRAM_APP_SECRET = 'secret-uji'; process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN = 'verify-uji'; process.env.BASE_URL = 'https://klira.test';
  jest.mocked(prisma.$transaction).mockImplementation(async (fn: unknown) => (fn as (tx: unknown) => Promise<unknown>)(prisma) as never);
  jest.mocked(prisma.igKoneksi.findUnique).mockResolvedValue(null); jest.mocked(prisma.igKoneksi.findFirst).mockResolvedValue(null);
});
it('menjawab challenge Meta hanya ketika verify token benar', async () => {
  expect((await fetch(`${url}/webhook/instagram?hub.mode=subscribe&hub.verify_token=salah&hub.challenge=123`)).status).toBe(403);
  const res = await fetch(`${url}/webhook/instagram?hub.mode=subscribe&hub.verify_token=verify-uji&hub.challenge=123`);
  expect(res.status).toBe(200); expect(await res.text()).toBe('123');
});
it('memverifikasi tanda tangan pada body mentah sebelum membaca database', async () => {
  const raw = '{ "object": "instagram", "entry": [] }';
  const kirim = (sig: string) => fetch(`${url}/webhook/instagram`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-hub-signature-256': sig }, body: raw });
  expect((await kirim('salah')).status).toBe(403); expect(prisma.igKoneksi.findUnique).not.toHaveBeenCalled();
  const sig = 'sha256=' + createHmac('sha256', 'secret-uji').update(raw).digest('hex'); expect((await kirim(sig)).status).toBe(200);
});
it('menolak callback tanpa sesi dan tidak memantulkan kode atau token ke URL', async () => {
  const res = await fetch(`${url}/auth/instagram/callback?state=${'a'.repeat(64)}&code=rahasia`, { redirect: 'manual' });
  expect(res.status).toBe(302); expect(res.headers.get('location')).toBe('/pengaturan?tab=instagram&instagram=izin');
});
it('menolak signed_request palsu dan menerbitkan status hanya setelah pemrosesan selesai', async () => {
  expect((await fetch(`${url}/instagram/data-deletion`, { method: 'POST', body: new URLSearchParams({ signed_request: 'fake' }) })).status).toBe(403);
  expect(prisma.$transaction).not.toHaveBeenCalled();
  const p = Buffer.from(JSON.stringify({ algorithm: 'HMAC-SHA256', user_id: '123456789' })).toString('base64url'); const sig = createHmac('sha256', 'secret-uji').update(p).digest('base64url');
  const res = await fetch(`${url}/instagram/data-deletion`, { method: 'POST', body: new URLSearchParams({ signed_request: `${sig}.${p}` }) });
  const data = await res.json(); expect(data.confirmation_code).toMatch(/^[a-f\d]{48}$/); expect(prisma.igPenghapusan.create).toHaveBeenCalledWith({ data: { kode: data.confirmation_code } });
  jest.mocked(prisma.igPenghapusan.findUnique).mockResolvedValue(null); expect((await fetch(`${url}/instagram/data-deletion-status/${'a'.repeat(48)}`)).status).toBe(404);
});
it('URL gambar sementara menyimpan hash dan menolak URL kadaluwarsa atau koneksi nonaktif', async () => {
  const token = 'b'.repeat(64);
  jest.mocked(prisma.igMediaPublik.findUnique).mockResolvedValue({ token_hash: hash(token), media_id: 'foto', generasi: 2, berakhir: new Date(Date.now() + 60000) } as never);
  jest.mocked(prisma.igKoneksi.findUnique).mockResolvedValue({ aktif: true, penyedia: 'meta', generasi: 2, fasyankes_id: 10 } as never);
  jest.mocked(prisma.igMedia.findFirst).mockResolvedValue({ mime: 'image/png', isi: Buffer.from('png-uji').toString('base64') } as never);
  const res = await fetch(`${url}/instagram/media/${token}`); expect(res.status).toBe(200); expect(await res.text()).toBe('png-uji'); expect(prisma.igMediaPublik.findUnique).toHaveBeenCalledWith({ where: { token_hash: hash(token) } });
  jest.mocked(prisma.igKoneksi.findUnique).mockResolvedValue({ aktif: false } as never); expect((await fetch(`${url}/instagram/media/${token}`)).status).toBe(404);
});
