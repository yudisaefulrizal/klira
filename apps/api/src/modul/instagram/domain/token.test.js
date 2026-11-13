import { jest } from '@jest/globals';

const kliraActual0 = await import("@klira/db");
const kliraActual1 = await import("./meta.js");
jest.unstable_mockModule('@klira/db', () => {
    const hapusIgMediaPublikUntukPerbaruiTokenInstagram = jest.fn();
    const hapusIgOauthStateUntukPerbaruiTokenInstagram = jest.fn();
    const ambilIgKoneksi = jest.fn();
    const ubahIgKoneksiUntukPerbaruiTokenInstagram = jest.fn();
    return { ...kliraActual0,
        pool: {},
        hapusIgMediaPublikUntukPerbaruiTokenInstagram: hapusIgMediaPublikUntukPerbaruiTokenInstagram,
        hapusIgOauthStateUntukPerbaruiTokenInstagram: hapusIgOauthStateUntukPerbaruiTokenInstagram,
        ambilIgKoneksi: ambilIgKoneksi,
        ubahIgKoneksiUntukPerbaruiTokenInstagram: ubahIgKoneksiUntukPerbaruiTokenInstagram,
        ubahIgKoneksiUntukPerbaruiTokenInstagram2: ubahIgKoneksiUntukPerbaruiTokenInstagram,
        ubahIgKoneksiUntukPerbaruiTokenInstagram3: ubahIgKoneksiUntukPerbaruiTokenInstagram,
        transaksi: jest.fn(async (fn) => fn({})),
        enkripsiRahasia: (v) => `encrypted:${v}`,
        dekripsiRahasia: (v) => v };
});
jest.unstable_mockModule('./meta.js', () => ({ ...kliraActual1, perpanjangToken: jest.fn() }));
const db = await import("@klira/db");
const { perpanjangToken } = await import("./meta.js");
const { perbaruiTokenInstagram } = await import("./token.js");

beforeEach(() => jest.clearAllMocks());

it('memperpanjang token sebelum habis dengan pembaruan bersyarat agar disconnect tidak dibatalkan', async () => {
    jest.mocked(db.ambilIgKoneksi).mockResolvedValue({ id: 1, fasyankes_id: 10, penyedia: 'meta', aktif: true, access_token: 'old', generasi: 5, token_berakhir: new Date(Date.now() + 86400000), token_diperbarui: new Date(Date.now() - 2 * 86400000) });
    jest.mocked(perpanjangToken).mockResolvedValue({ token: 'new', masa: 5184000 });
    await perbaruiTokenInstagram();
    expect(perpanjangToken).toHaveBeenCalledWith('old');
    expect(jest.mocked(db.ubahIgKoneksiUntukPerbaruiTokenInstagram).mock.calls.map(args => ({ ...args }))).toEqual(expect.arrayContaining([expect.objectContaining({ 0: 'encrypted:new', 3: 1, 4: true, 5: 5, 6: 'old' })]));
});

it('tidak memperpanjang token yang masih baru atau sudah berakhir', async () => {
    jest.mocked(db.ambilIgKoneksi).mockResolvedValue({ aktif: true, penyedia: 'meta', access_token: 'old', generasi: 5, token_berakhir: new Date(Date.now() + 86400000), token_diperbarui: new Date() });
    await perbaruiTokenInstagram();
    expect(perpanjangToken).not.toHaveBeenCalled();
    jest.mocked(db.ambilIgKoneksi).mockResolvedValue({ aktif: true, penyedia: 'meta', access_token: 'old', generasi: 5, token_berakhir: new Date(0) });
    await perbaruiTokenInstagram();
    expect(perpanjangToken).not.toHaveBeenCalled();
    expect(jest.mocked(db.ubahIgKoneksiUntukPerbaruiTokenInstagram).mock.calls.map(args => ({ ...args }))).toEqual(expect.arrayContaining([expect.objectContaining({ 0: 'kedaluwarsa', 1: null, 4: 'old' })]));
});