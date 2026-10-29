import { prisma } from '@klira/db';
import { ambilNamaInstagram, ambilProfilInstagram, fotoProfilInstagram, namaProfilInstagram, perbaruiNamaKontakInstagram } from './profil';
jest.mock('@klira/db', () => ({ prisma: {
  $transaction: jest.fn(), $queryRaw: jest.fn(), igKoneksi: { findUnique: jest.fn() },
  igPercakapan: { findUnique: jest.fn(), updateMany: jest.fn() },
}, dekripsiRahasia: (v: string) => v }));
const fetchAsli = global.fetch;
const row = { aktif: true, penyedia: 'meta', fasyankes_id: 10, akun_id: '987654321', generasi: 1, access_token: 'token-uji', token_berakhir: new Date(Date.now() + 86400000) };
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(prisma.$transaction).mockImplementation(async (fn: unknown) => (fn as (tx: unknown) => Promise<unknown>)(prisma) as never);
  jest.mocked(prisma.igKoneksi.findUnique).mockResolvedValue(row as never);
  jest.mocked(prisma.igPercakapan.updateMany).mockResolvedValue({ count: 1 });
});
afterEach(() => { global.fetch = fetchAsli; });
it('mengutamakan nama dengan username, lalu username jika nama tidak tersedia', () => {
  expect(namaProfilInstagram({ name: '  Ayu   Lestari ', username: 'ayu.lestari' })).toBe('Ayu Lestari (@ayu.lestari)');
  expect(namaProfilInstagram({ name: '', username: 'ayu.lestari' })).toBe('@ayu.lestari');
  expect(namaProfilInstagram({ name: 'Ayu', username: 42 })).toBe('Ayu');
  expect(namaProfilInstagram({})).toBeNull();
});
it('mengambil profil melalui token header dan mengabaikan kegagalan API', async () => {
  const ambil = jest.fn().mockResolvedValueOnce(Response.json({ name: 'Ayu', username: 'ayu' })).mockRejectedValueOnce(new Error('timeout'));
  global.fetch = ambil;
  expect(await ambilNamaInstagram('token-uji', '123456789')).toBe('Ayu (@ayu)');
  expect(ambil.mock.calls[0][0]).toMatch(/123456789\?fields=name,username,profile_pic$/);
  expect(ambil.mock.calls[0][1].headers).toEqual({ Authorization: 'Bearer token-uji' });
  expect(await ambilNamaInstagram('token-uji', '123456789')).toBeNull();
});
it('melengkapi kontak lama secara bersyarat dan menggabungkan lookup bersamaan', async () => {
  jest.mocked(prisma.igPercakapan.findUnique).mockResolvedValue({ id: 1001, fasyankes_id: 10, jid: '123456789', nama: '123456789' } as never);
  global.fetch = jest.fn().mockResolvedValue(Response.json({ name: 'Ayu', username: 'ayu' }));
  const hasil = await Promise.all([perbaruiNamaKontakInstagram(1001), perbaruiNamaKontakInstagram(1001)]);
  expect(hasil).toEqual([true, true]); expect(global.fetch).toHaveBeenCalledTimes(1);
  expect(prisma.igPercakapan.updateMany).toHaveBeenCalledWith({ where: { id: 1001, fasyankes_id: 10, jid: '123456789', nama: '123456789' }, data: { nama: 'Ayu (@ayu)', foto_profil: null, profil_diperbarui_pada: expect.any(Date) } });
});
it('tidak menimpa nama yang sudah tersedia', async () => {
  jest.mocked(prisma.igPercakapan.findUnique).mockResolvedValue({ id: 1002, jid: '123456789', nama: 'Ayu', profil_diperbarui_pada: new Date() } as never);
  global.fetch = jest.fn();
  expect(await perbaruiNamaKontakInstagram(1002)).toBe(false);
  expect(global.fetch).not.toHaveBeenCalled(); expect(prisma.igPercakapan.updateMany).not.toHaveBeenCalled();
});
it('hasil API yang lambat tidak memperbarui kontak setelah koneksi diputuskan', async () => {
  jest.mocked(prisma.igPercakapan.findUnique).mockResolvedValue({ id: 1003, fasyankes_id: 10, jid: '123456789', nama: '123456789' } as never);
  jest.mocked(prisma.igKoneksi.findUnique).mockResolvedValueOnce(row as never).mockResolvedValueOnce({ ...row, aktif: false, generasi: 2 } as never);
  global.fetch = jest.fn().mockResolvedValue(Response.json({ name: 'Ayu' }));
  expect(await perbaruiNamaKontakInstagram(1003)).toBe(false); expect(prisma.igPercakapan.updateMany).not.toHaveBeenCalled();
});

it('membaca foto profil dan menolak alamat di luar CDN Meta', async () => {
  const foto = 'https://scontent.cdninstagram.com/avatar.jpg?token=abc';
  global.fetch = jest.fn().mockResolvedValue(Response.json({ username: 'ayu', profile_pic: foto }));
  expect(await ambilProfilInstagram('token-uji', '123456789')).toEqual({ nama: '@ayu', foto });
  for (const value of ['http://cdninstagram.com/a', 'https://cdninstagram.com.evil.test/a', 'https://user:pass@fbcdn.net/a', 'javascript:alert(1)', null]) expect(fotoProfilInstagram(value)).toBeNull();
});
it('melengkapi foto kontak yang sudah memiliki nama tanpa menimpa nama', async () => {
  jest.mocked(prisma.igPercakapan.findUnique).mockResolvedValue({ id: 1004, fasyankes_id: 10, jid: '123456789', nama: 'Ayu' } as never);
  const foto = 'https://scontent.fbcdn.net/avatar.jpg';
  global.fetch = jest.fn().mockResolvedValue(Response.json({ name: 'Nama lain', profile_pic: foto }));
  expect(await perbaruiNamaKontakInstagram(1004)).toBe(true);
  expect(prisma.igPercakapan.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: { foto_profil: foto, profil_diperbarui_pada: expect.any(Date) } }));
});
it('memperbarui URL foto yang kedaluwarsa dan mengabaikan kegagalan API', async () => {
  const kontak = { fasyankes_id: 10, jid: '123456789', nama: 'Ayu', foto_profil: 'https://scontent.fbcdn.net/lama.jpg', profil_diperbarui_pada: new Date(Date.now() - 2 * 86400000) };
  jest.mocked(prisma.igPercakapan.findUnique).mockResolvedValue({ ...kontak, id: 1005 } as never);
  global.fetch = jest.fn().mockResolvedValue(Response.json({ profile_pic: 'https://scontent.fbcdn.net/baru.jpg' }));
  expect(await perbaruiNamaKontakInstagram(1005)).toBe(true);
  expect(prisma.igPercakapan.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: { foto_profil: 'https://scontent.fbcdn.net/baru.jpg', profil_diperbarui_pada: expect.any(Date) } }));
  jest.mocked(prisma.igPercakapan.updateMany).mockClear();
  jest.mocked(prisma.igPercakapan.findUnique).mockResolvedValue({ ...kontak, id: 1006 } as never);
  global.fetch = jest.fn().mockRejectedValue(new Error('timeout'));
  expect(await perbaruiNamaKontakInstagram(1006)).toBe(false);
  expect(prisma.igPercakapan.updateMany).not.toHaveBeenCalled();
});
