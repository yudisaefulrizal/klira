import * as db from '@klira/db';

import { perpanjangToken } from './meta';
import { perbaruiTokenInstagram } from './token';
jest.mock('@klira/db', () => {
  const hapusIgMediaPublikUntukPerbaruiTokenInstagram = jest.fn();
  const hapusIgOauthStateUntukPerbaruiTokenInstagram = jest.fn();
  const ambilIgKoneksi = jest.fn();
  const ubahIgKoneksiUntukPerbaruiTokenInstagram = jest.fn();
  return { ...jest.requireActual('@klira/db'),
    pool: {},
    hapusIgMediaPublikUntukPerbaruiTokenInstagram: hapusIgMediaPublikUntukPerbaruiTokenInstagram,
    hapusIgOauthStateUntukPerbaruiTokenInstagram: hapusIgOauthStateUntukPerbaruiTokenInstagram,
    ambilIgKoneksi: ambilIgKoneksi,
    ubahIgKoneksiUntukPerbaruiTokenInstagram: ubahIgKoneksiUntukPerbaruiTokenInstagram,
    ubahIgKoneksiUntukPerbaruiTokenInstagram2: ubahIgKoneksiUntukPerbaruiTokenInstagram,
    ubahIgKoneksiUntukPerbaruiTokenInstagram3: ubahIgKoneksiUntukPerbaruiTokenInstagram,
    transaksi: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn({})),
    enkripsiRahasia: (v: string) => `encrypted:${v}`,
    dekripsiRahasia: (v: string) => v };
});
jest.mock('./meta', () => ({ ...jest.requireActual('./meta'), perpanjangToken: jest.fn() }));
beforeEach(() => jest.clearAllMocks());
it('memperpanjang token sebelum habis dengan pembaruan bersyarat agar disconnect tidak dibatalkan', async () => {
  jest.mocked(db.ambilIgKoneksi).mockResolvedValue({ id: 1, fasyankes_id: 10, penyedia: 'meta', aktif: true, access_token: 'old', generasi: 5, token_berakhir: new Date(Date.now() + 86400000), token_diperbarui: new Date(Date.now() - 2 * 86400000) } as never);
  jest.mocked(perpanjangToken).mockResolvedValue({ token: 'new', masa: 5184000 });
  await perbaruiTokenInstagram();
  expect(perpanjangToken).toHaveBeenCalledWith('old');
  expect(jest.mocked(db.ubahIgKoneksiUntukPerbaruiTokenInstagram).mock.calls.map(args => ({ ...args }))).toEqual(expect.arrayContaining([expect.objectContaining({ 0: 'encrypted:new', 3: 1, 4: true, 5: 5, 6: 'old' })]));
});
it('tidak memperpanjang token yang masih baru atau sudah berakhir', async () => {
  jest.mocked(db.ambilIgKoneksi).mockResolvedValue({ aktif: true, penyedia: 'meta', access_token: 'old', generasi: 5, token_berakhir: new Date(Date.now() + 86400000), token_diperbarui: new Date() } as never);
  await perbaruiTokenInstagram(); expect(perpanjangToken).not.toHaveBeenCalled();
  jest.mocked(db.ambilIgKoneksi).mockResolvedValue({ aktif: true, penyedia: 'meta', access_token: 'old', generasi: 5, token_berakhir: new Date(0) } as never);
  await perbaruiTokenInstagram(); expect(perpanjangToken).not.toHaveBeenCalled(); expect(jest.mocked(db.ubahIgKoneksiUntukPerbaruiTokenInstagram).mock.calls.map(args => ({ ...args }))).toEqual(expect.arrayContaining([expect.objectContaining({ 0: 'kedaluwarsa', 1: null, 4: 'old' })]));
});
