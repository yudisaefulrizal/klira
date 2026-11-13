import { jest } from '@jest/globals';

const kliraActual0 = await import("@klira/db");
jest.unstable_mockModule('@klira/db', () => {
    const ambilIgKoneksi = jest.fn();
    const cariIgKoneksiUntukBuatRuteInstagramPublik = jest.fn();
    const tambahIgPenghapusanUntukBuatRuteInstagramPublik = jest.fn();
    const ambilIgPenghapusanUntukBuatRuteInstagramPublik = jest.fn();
    const ambilIgMediaPublikUntukBuatRuteInstagramPublik = jest.fn();
    const cariIgMediaUntukBuatRuteInstagram = jest.fn();
    const kunci = jest.fn();
    return { ...kliraActual0,
        pool: {},
        ambilIgKoneksi: ambilIgKoneksi,
        cariIgKoneksiUntukBuatRuteInstagramPublik: cariIgKoneksiUntukBuatRuteInstagramPublik,
        tambahIgPenghapusanUntukBuatRuteInstagramPublik: tambahIgPenghapusanUntukBuatRuteInstagramPublik,
        ambilIgPenghapusanUntukBuatRuteInstagramPublik: ambilIgPenghapusanUntukBuatRuteInstagramPublik,
        ambilIgMediaPublikUntukBuatRuteInstagramPublik: ambilIgMediaPublikUntukBuatRuteInstagramPublik,
        cariIgMediaUntukBuatRuteInstagram: cariIgMediaUntukBuatRuteInstagram,
        transaksi: jest.fn(async (fn) => fn({})),
        kunciIgKoneksi: kunci,
        dekripsiRahasia: (v) => v };
});
const db = await import("@klira/db");
const { createHmac } = await import("node:crypto");
const { default: express } = await import("express");
const { buatRuteInstagramPublik } = await import("./publik.js");
const { hash } = await import("../domain/meta.js");

const env = { ...process.env };

const app = express();

app.use(buatRuteInstagramPublik({ saya: async () => null }));

app.use(express.json());

let server;

let url;

beforeAll(async () => { await new Promise((resolve) => { server = app.listen(0, '127.0.0.1', () => resolve()); }); url = `http://127.0.0.1:${server.address().port}`; });

afterAll(async () => { process.env = env; await new Promise((resolve) => server.close(() => resolve())); });

beforeEach(() => {
    jest.clearAllMocks();
    process.env.INSTAGRAM_APP_SECRET = 'secret-uji';
    process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN = 'verify-uji';
    process.env.BASE_URL = 'https://klira.test';
    jest.mocked(db.transaksi).mockImplementation(async (fn) => fn(db.pool));
    jest.mocked(db.ambilIgKoneksi).mockResolvedValue(null);
    jest.mocked(db.cariIgKoneksiUntukBuatRuteInstagramPublik).mockResolvedValue(null);
});

it('menjawab challenge Meta hanya ketika verify token benar', async () => {
    expect((await fetch(`${url}/webhook/instagram?hub.mode=subscribe&hub.verify_token=salah&hub.challenge=123`)).status).toBe(403);
    const res = await fetch(`${url}/webhook/instagram?hub.mode=subscribe&hub.verify_token=verify-uji&hub.challenge=123`);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('123');
});

it('memverifikasi tanda tangan pada body mentah sebelum membaca database', async () => {
    const raw = '{ "object": "instagram", "entry": [] }';
    const kirim = (sig) => fetch(`${url}/webhook/instagram`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-hub-signature-256': sig }, body: raw });
    expect((await kirim('salah')).status).toBe(403);
    expect(db.ambilIgKoneksi).not.toHaveBeenCalled();
    const sig = 'sha256=' + createHmac('sha256', 'secret-uji').update(raw).digest('hex');
    expect((await kirim(sig)).status).toBe(200);
});

it('menolak callback tanpa sesi dan tidak memantulkan kode atau token ke URL', async () => {
    const res = await fetch(`${url}/auth/instagram/callback?state=${'a'.repeat(64)}&code=rahasia`, { redirect: 'manual' });
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('/pesan?kanal=instagram&instagram=izin');
});

it('menolak signed_request palsu dan menerbitkan status hanya setelah pemrosesan selesai', async () => {
    expect((await fetch(`${url}/instagram/data-deletion`, { method: 'POST', body: new URLSearchParams({ signed_request: 'fake' }) })).status).toBe(403);
    expect(db.transaksi).not.toHaveBeenCalled();
    const p = Buffer.from(JSON.stringify({ algorithm: 'HMAC-SHA256', user_id: '123456789' })).toString('base64url');
    const sig = createHmac('sha256', 'secret-uji').update(p).digest('base64url');
    const res = await fetch(`${url}/instagram/data-deletion`, { method: 'POST', body: new URLSearchParams({ signed_request: `${sig}.${p}` }) });
    const data = await res.json();
    expect(data.confirmation_code).toMatch(/^[a-f\d]{48}$/);
    expect(jest.mocked(db.tambahIgPenghapusanUntukBuatRuteInstagramPublik).mock.calls.map(args => ({ ...args }))).toEqual(expect.arrayContaining([expect.objectContaining({ 0: data.confirmation_code })]));
    jest.mocked(db.ambilIgPenghapusanUntukBuatRuteInstagramPublik).mockResolvedValue(null);
    expect((await fetch(`${url}/instagram/data-deletion-status/${'a'.repeat(48)}`)).status).toBe(404);
});

it('URL gambar sementara menyimpan hash dan menolak URL kadaluwarsa atau koneksi nonaktif', async () => {
    const token = 'b'.repeat(64);
    jest.mocked(db.ambilIgMediaPublikUntukBuatRuteInstagramPublik).mockResolvedValue({ token_hash: hash(token), media_id: 'foto', generasi: 2, berakhir: new Date(Date.now() + 60000) });
    jest.mocked(db.ambilIgKoneksi).mockResolvedValue({ aktif: true, penyedia: 'meta', generasi: 2, fasyankes_id: 10 });
    jest.mocked(db.cariIgMediaUntukBuatRuteInstagram).mockResolvedValue({ mime: 'image/png', isi: Buffer.from('png-uji').toString('base64') });
    const res = await fetch(`${url}/instagram/media/${token}`);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('png-uji');
    expect(jest.mocked(db.ambilIgMediaPublikUntukBuatRuteInstagramPublik).mock.calls.map(args => ({ ...args }))).toEqual(expect.arrayContaining([expect.objectContaining({ 0: hash(token) })]));
    jest.mocked(db.ambilIgKoneksi).mockResolvedValue({ aktif: false });
    expect((await fetch(`${url}/instagram/media/${token}`)).status).toBe(404);
});