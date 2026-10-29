import type { Request } from 'express';
import { prisma } from '@klira/db';
import type { PenggunaSaya } from '@klira/shared';
import type { LayananAkses } from '../akses/layanan';
import { mulaiLogin, selesaikanLogin } from './login';
import { hash, tukarKode, langgananWebhook } from './meta';
jest.mock('@klira/db', () => ({ prisma: {
  $transaction: jest.fn(), $queryRaw: jest.fn(),
  igKoneksi: { upsert: jest.fn(), findUnique: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
  igOauthState: { create: jest.fn(), findUnique: jest.fn(), deleteMany: jest.fn() }, igPercakapan: { count: jest.fn() },
}, enkripsiRahasia: (v: string) => `encrypted:${v}` }));
jest.mock('./meta', () => ({ ...jest.requireActual('./meta'), tukarKode: jest.fn(), langgananWebhook: jest.fn() }));
const user = { id: 7, fasyankes_id: 10, wajib_ganti_kredensial: false, izin: [{ fitur: 'instagram', aksi: 'lihat', cakupan: 'unit' }] } as PenggunaSaya;
const akses = { saya: jest.fn(async () => user) } as unknown as LayananAkses;
const env = { ...process.env };
const state = 'a'.repeat(64);
const request = (query: Record<string, string>, sesi = 'session-uji') => ({ query, headers: { cookie: `klira_sesi=${sesi}` } }) as unknown as Request;
const saved = () => ({ hash: hash(state), pengguna_id: 7, fasyankes_id: 10, sesi_hash: hash('session-uji'), generasi: 3, berakhir: new Date(Date.now() + 60000) });
beforeEach(() => {
  jest.clearAllMocks();
  process.env.INSTAGRAM_APP_ID = '123'; process.env.INSTAGRAM_APP_SECRET = 'secret'; process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN = 'verify'; process.env.BASE_URL = 'https://klira.test';
  jest.mocked(prisma.$transaction).mockImplementation(async (fn: unknown) => (fn as (tx: unknown) => Promise<unknown>)(prisma) as never);
  jest.mocked(prisma.igKoneksi.findUnique).mockResolvedValue({ id: 1, fasyankes_id: 10, generasi: 3, penyedia: 'meta', akun_id: '' } as never);
  jest.mocked(prisma.igKoneksi.update).mockResolvedValue({ generasi: 3 } as never);
  jest.mocked(prisma.igKoneksi.updateMany).mockResolvedValue({ count: 1 });
  jest.mocked(prisma.igOauthState.findUnique).mockResolvedValue(saved() as never);
  jest.mocked(prisma.igOauthState.deleteMany).mockResolvedValue({ count: 1 });
  jest.mocked(tukarKode).mockResolvedValue({ id: '123456789', loginId: '123456789', username: 'klinik', token: 'token-uji', masa: 5184000 });
  jest.mocked(akses.saya).mockResolvedValue(user);
});
afterAll(() => { process.env = env; });
it('membuat state acak sekali pakai, terikat sesi dan fasyankes, dengan scope DM saja', async () => {
  const { url } = await mulaiLogin(user, 'session-uji'); const target = new URL(url);
  expect(target.origin).toBe('https://www.instagram.com'); expect(target.searchParams.get('scope')).toBe('instagram_business_basic,instagram_business_manage_messages');
  expect(target.searchParams.get('redirect_uri')).toBe('https://klira.test/auth/instagram/callback');
  const data = jest.mocked(prisma.igOauthState.create).mock.calls[0][0].data;
  expect(data).toMatchObject({ hash: hash(target.searchParams.get('state')!), sesi_hash: hash('session-uji'), pengguna_id: 7, fasyankes_id: 10 });
  expect(data.hash).not.toBe(target.searchParams.get('state'));
});
it('menolak callback dari sesi lain, state kedaluwarsa dan replay sebelum memanggil Meta', async () => {
  expect(await selesaikanLogin(request({ state, code: 'kode' }, 'session-lain'), akses)).toBe('state');
  jest.mocked(prisma.igOauthState.findUnique).mockResolvedValue({ ...saved(), berakhir: new Date(0) } as never);
  expect(await selesaikanLogin(request({ state, code: 'kode' }), akses)).toBe('state');
  jest.mocked(prisma.igOauthState.findUnique).mockResolvedValue(saved() as never);
  jest.mocked(prisma.igOauthState.deleteMany).mockResolvedValue({ count: 0 });
  expect(await selesaikanLogin(request({ state, code: 'kode' }), akses)).toBe('state'); expect(tukarKode).not.toHaveBeenCalled();
});
it('menolak akun Instagram kedua dan callback yang digantikan login lebih baru', async () => {
  jest.mocked(prisma.igKoneksi.findUnique).mockResolvedValue({ fasyankes_id: 10, generasi: 3, penyedia: 'meta', akun_id: '999999999' } as never);
  expect(await selesaikanLogin(request({ state, code: 'kode' }), akses)).toBe('akun-berbeda'); expect(langgananWebhook).not.toHaveBeenCalled();
  jest.mocked(prisma.igKoneksi.findUnique).mockResolvedValue({ fasyankes_id: 10, generasi: 4, penyedia: 'meta', akun_id: '' } as never);
  expect(await selesaikanLogin(request({ state, code: 'kode' }), akses)).toBe('state');
});
it('tidak mengaktifkan akun ketika langganan webhook gagal', async () => {
  jest.mocked(langgananWebhook).mockRejectedValueOnce(new Error('webhook gagal'));
  await expect(selesaikanLogin(request({ state, code: 'kode' }), akses)).rejects.toThrow(); expect(prisma.igKoneksi.updateMany).not.toHaveBeenCalled();
});
it('menyimpan token terenkripsi sesudah webhook siap, tanpa token di URL hasil', async () => {
  expect(await selesaikanLogin(request({ state, code: 'kode' }), akses)).toBe('terhubung');
  expect(prisma.igKoneksi.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 1, fasyankes_id: 10, generasi: 3 }, data: expect.objectContaining({ access_token: 'encrypted:token-uji', webhook_aktif: true, aktif: true, api_key: null }) }));
});
it('memeriksa ulang izin setelah jaringan Meta dan menolak pembatalan', async () => {
  jest.mocked(akses.saya).mockResolvedValueOnce(user).mockResolvedValueOnce({ ...user, izin: [] });
  expect(await selesaikanLogin(request({ state, code: 'kode' }), akses)).toBe('izin'); expect(prisma.igKoneksi.updateMany).not.toHaveBeenCalled();
  expect(await selesaikanLogin(request({ state, error: 'access_denied' }), akses)).toBe('dibatalkan');
});
