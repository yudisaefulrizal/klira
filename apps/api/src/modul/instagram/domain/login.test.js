import { jest } from '@jest/globals';

const kliraActual0 = await import("@klira/db");
const kliraActual1 = await import("./meta.js");
jest.unstable_mockModule('@klira/db', () => {
    const simpanIgKoneksiUntukMulaiLogin = jest.fn();
    const ambilIgKoneksi = jest.fn();
    const ubahIgKoneksiUntukMulaiLogin = jest.fn();
    const ubahIgKoneksiUntukSelesaikanLogin = jest.fn();
    const tambahIgOauthStateUntukMulaiLogin = jest.fn();
    const ambilIgOauthStateUntukSelesaikanLogin = jest.fn();
    const hapusIgOauthStateUntukMulaiLogin = jest.fn();
    const hitungIgPercakapanUntukMulaiLogin = jest.fn();
    const kunci = jest.fn();
    return { ...kliraActual0,
        pool: {},
        simpanIgKoneksiUntukMulaiLogin: simpanIgKoneksiUntukMulaiLogin,
        ambilIgKoneksi: ambilIgKoneksi,
        ubahIgKoneksiUntukMulaiLogin: ubahIgKoneksiUntukMulaiLogin,
        ubahIgKoneksiUntukMulaiLoginHasil: jest.fn(async () => await ubahIgKoneksiUntukMulaiLogin.mock.results.at(-1)?.value),
        ubahIgKoneksiUntukSelesaikanLogin: ubahIgKoneksiUntukSelesaikanLogin,
        tambahIgOauthStateUntukMulaiLogin: tambahIgOauthStateUntukMulaiLogin,
        ambilIgOauthStateUntukSelesaikanLogin: ambilIgOauthStateUntukSelesaikanLogin,
        hapusIgOauthStateUntukMulaiLogin: hapusIgOauthStateUntukMulaiLogin,
        hapusIgOauthStateUntukSelesaikanLogin: hapusIgOauthStateUntukMulaiLogin,
        hitungIgPercakapanUntukMulaiLogin: hitungIgPercakapanUntukMulaiLogin,
        transaksi: jest.fn(async (fn) => fn({})),
        kunciIgKoneksi: kunci,
        enkripsiRahasia: (v) => `encrypted:${v}` };
});
jest.unstable_mockModule('./meta.js', () => ({ ...kliraActual1, tukarKode: jest.fn(), langgananWebhook: jest.fn() }));
const db = await import("@klira/db");
const { mulaiLogin, selesaikanLogin } = await import("./login.js");
const { hash, tukarKode, langgananWebhook } = await import("./meta.js");

const user = { id: 7, fasyankes_id: 10, wajib_ganti_kredensial: false, izin: [{ fitur: 'instagram', aksi: 'lihat', cakupan: 'unit' }] };

const akses = { saya: jest.fn(async () => user) };

const env = { ...process.env };

const state = 'a'.repeat(64);

const request = (query, sesi = 'session-uji') => ({ query, headers: { cookie: `klira_sesi=${sesi}` } });

const saved = () => ({ hash: hash(state), pengguna_id: 7, fasyankes_id: 10, sesi_hash: hash('session-uji'), generasi: 3, berakhir: new Date(Date.now() + 60000) });

beforeEach(() => {
    jest.clearAllMocks();
    process.env.INSTAGRAM_APP_ID = '123';
    process.env.INSTAGRAM_APP_SECRET = 'secret';
    process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN = 'verify';
    process.env.BASE_URL = 'https://klira.test';
    jest.mocked(db.transaksi).mockImplementation(async (fn) => fn(db.pool));
    jest.mocked(db.ambilIgKoneksi).mockResolvedValue({ id: 1, fasyankes_id: 10, generasi: 3, penyedia: 'meta', akun_id: '' });
    jest.mocked(db.ubahIgKoneksiUntukMulaiLogin).mockResolvedValue({ generasi: 3 });
    jest.mocked(db.ubahIgKoneksiUntukSelesaikanLogin).mockResolvedValue({ count: 1 });
    jest.mocked(db.ambilIgOauthStateUntukSelesaikanLogin).mockResolvedValue(saved());
    jest.mocked(db.hapusIgOauthStateUntukMulaiLogin).mockResolvedValue({ count: 1 });
    jest.mocked(tukarKode).mockResolvedValue({ id: '123456789', loginId: '123456789', username: 'klinik', token: 'token-uji', masa: 5184000 });
    jest.mocked(akses.saya).mockResolvedValue(user);
});

afterAll(() => { process.env = env; });

it('membuat state acak sekali pakai, terikat sesi dan fasyankes, dengan scope DM saja', async () => {
    const { url } = await mulaiLogin(user, 'session-uji');
    const target = new URL(url);
    expect(target.origin).toBe('https://www.instagram.com');
    expect(target.searchParams.get('scope')).toBe('instagram_business_basic,instagram_business_manage_messages');
    expect(target.searchParams.get('redirect_uri')).toBe('https://klira.test/auth/instagram/callback');
    const [hashState, pengguna_id, fasyankes_id, sesi_hash] = jest.mocked(db.tambahIgOauthStateUntukMulaiLogin).mock.calls[0];
    const data = { hash: hashState, pengguna_id, fasyankes_id, sesi_hash };
    expect(data).toMatchObject({ hash: hash(target.searchParams.get('state')), sesi_hash: hash('session-uji'), pengguna_id: 7, fasyankes_id: 10 });
    expect(data.hash).not.toBe(target.searchParams.get('state'));
});

it('menolak callback dari sesi lain, state kedaluwarsa dan replay sebelum memanggil Meta', async () => {
    expect(await selesaikanLogin(request({ state, code: 'kode' }, 'session-lain'), akses)).toBe('state');
    jest.mocked(db.ambilIgOauthStateUntukSelesaikanLogin).mockResolvedValue({ ...saved(), berakhir: new Date(0) });
    expect(await selesaikanLogin(request({ state, code: 'kode' }), akses)).toBe('state');
    jest.mocked(db.ambilIgOauthStateUntukSelesaikanLogin).mockResolvedValue(saved());
    jest.mocked(db.hapusIgOauthStateUntukMulaiLogin).mockResolvedValue({ count: 0 });
    expect(await selesaikanLogin(request({ state, code: 'kode' }), akses)).toBe('state');
    expect(tukarKode).not.toHaveBeenCalled();
});

it('menolak akun Instagram kedua dan callback yang digantikan login lebih baru', async () => {
    jest.mocked(db.ambilIgKoneksi).mockResolvedValue({ fasyankes_id: 10, generasi: 3, penyedia: 'meta', akun_id: '999999999' });
    expect(await selesaikanLogin(request({ state, code: 'kode' }), akses)).toBe('akun-berbeda');
    expect(langgananWebhook).not.toHaveBeenCalled();
    jest.mocked(db.ambilIgKoneksi).mockResolvedValue({ fasyankes_id: 10, generasi: 4, penyedia: 'meta', akun_id: '' });
    expect(await selesaikanLogin(request({ state, code: 'kode' }), akses)).toBe('state');
});

it('tidak mengaktifkan akun ketika langganan webhook gagal', async () => {
    jest.mocked(langgananWebhook).mockRejectedValueOnce(new Error('webhook gagal'));
    await expect(selesaikanLogin(request({ state, code: 'kode' }), akses)).rejects.toThrow();
    expect(db.ubahIgKoneksiUntukSelesaikanLogin).not.toHaveBeenCalled();
});

it('menyimpan token terenkripsi sesudah webhook siap, tanpa token di URL hasil', async () => {
    expect(await selesaikanLogin(request({ state, code: 'kode' }), akses)).toBe('terhubung');
    expect(jest.mocked(db.ubahIgKoneksiUntukSelesaikanLogin).mock.calls.map(args => ({ ...args }))).toEqual(expect.arrayContaining([expect.objectContaining({ 0: true, 4: null, 7: 'encrypted:token-uji', 10: 1, 11: 10, 12: 3 })]));
});

it('memeriksa ulang izin setelah jaringan Meta dan menolak pembatalan', async () => {
    jest.mocked(akses.saya).mockResolvedValueOnce(user).mockResolvedValueOnce({ ...user, izin: [] });
    expect(await selesaikanLogin(request({ state, code: 'kode' }), akses)).toBe('izin');
    expect(db.ubahIgKoneksiUntukSelesaikanLogin).not.toHaveBeenCalled();
    expect(await selesaikanLogin(request({ state, error: 'access_denied' }), akses)).toBe('dibatalkan');
});