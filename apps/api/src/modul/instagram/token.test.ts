import { prisma } from '@klira/db';
import { perpanjangToken } from './meta';
import { perbaruiTokenInstagram } from './token';
jest.mock('@klira/db', () => ({ prisma: { igMediaPublik: { deleteMany: jest.fn() }, igOauthState: { deleteMany: jest.fn() }, igKoneksi: { findUnique: jest.fn(), updateMany: jest.fn() } }, enkripsiRahasia: (v: string) => `encrypted:${v}`, dekripsiRahasia: (v: string) => v }));
jest.mock('./meta', () => ({ ...jest.requireActual('./meta'), perpanjangToken: jest.fn() }));
beforeEach(() => jest.clearAllMocks());
it('memperpanjang token sebelum habis dengan pembaruan bersyarat agar disconnect tidak dibatalkan', async () => {
  jest.mocked(prisma.igKoneksi.findUnique).mockResolvedValue({ id: 1, fasyankes_id: 10, penyedia: 'meta', aktif: true, access_token: 'old', generasi: 5, token_berakhir: new Date(Date.now() + 86400000), token_diperbarui: new Date(Date.now() - 2 * 86400000) } as never);
  jest.mocked(perpanjangToken).mockResolvedValue({ token: 'new', masa: 5184000 });
  await perbaruiTokenInstagram();
  expect(perpanjangToken).toHaveBeenCalledWith('old');
  expect(prisma.igKoneksi.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 1, aktif: true, generasi: 5, access_token: 'old' }, data: expect.objectContaining({ access_token: 'encrypted:new' }) }));
});
it('tidak memperpanjang token yang masih baru atau sudah berakhir', async () => {
  jest.mocked(prisma.igKoneksi.findUnique).mockResolvedValue({ aktif: true, penyedia: 'meta', access_token: 'old', generasi: 5, token_berakhir: new Date(Date.now() + 86400000), token_diperbarui: new Date() } as never);
  await perbaruiTokenInstagram(); expect(perpanjangToken).not.toHaveBeenCalled();
  jest.mocked(prisma.igKoneksi.findUnique).mockResolvedValue({ aktif: true, penyedia: 'meta', access_token: 'old', generasi: 5, token_berakhir: new Date(0) } as never);
  await perbaruiTokenInstagram(); expect(perpanjangToken).not.toHaveBeenCalled(); expect(prisma.igKoneksi.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: { status: 'kedaluwarsa', access_token: null } }));
});
