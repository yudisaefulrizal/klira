import { jest } from '@jest/globals';

const kliraActual0 = await import("../domain/meta.js");
const kliraActual1 = await import("@klira/db");
jest.unstable_mockModule('../domain/meta.js', () => ({ ...kliraActual0, metaTersedia: () => false }));
jest.unstable_mockModule('@klira/db', () => {
    const ambilIgKoneksi = jest.fn();
    const cariIgPercakapanUntukBuatRuteInstagram = jest.fn();
    const kunci = jest.fn();
    return { ...kliraActual1,
        pool: {},
        ambilIgKoneksi: ambilIgKoneksi,
        cariIgPercakapanUntukBuatRuteInstagram: cariIgPercakapanUntukBuatRuteInstagram,
        transaksi: jest.fn(async (fn) => fn({})),
        hitungIgPercakapanBelumDibaca: kunci,
        enkripsiRahasia: jest.fn((v) => v),
        dekripsiRahasia: jest.fn((v) => v) };
});
const db = await import("@klira/db");
const { default: express } = await import("express");
const { buatRuteInstagram } = await import("./rute.js");

let user;

const akses = { saya: async () => user };

const izin = { catatPenolakan: async () => { }, catatTindakan: async () => { } };

const app = express();

app.use(express.json());

app.use('/api', buatRuteInstagram(akses, izin));

let server;

let url;

beforeAll(async () => {
    await new Promise((resolve) => { server = app.listen(0, '127.0.0.1', () => resolve()); });
    url = `http://127.0.0.1:${server.address().port}/api/instagram`;
});

afterAll(async () => { await new Promise((resolve) => server.close(() => resolve())); });

beforeEach(() => {
    jest.clearAllMocks();
    user = { id: 7, fasyankes_id: 10, izin: [{ fitur: 'instagram', aksi: 'lihat', cakupan: 'unit' }] };
});

it('menolak sesi kosong dan izin WhatsApp tanpa izin Instagram', async () => {
    user = null;
    expect((await fetch(`${url}/koneksi`)).status).toBe(401);
    user = { id: 7, fasyankes_id: 10, izin: [{ fitur: 'whatsapp', aksi: 'lihat', cakupan: 'unit' }] };
    expect((await fetch(`${url}/koneksi`)).status).toBe(403);
    expect(db.ambilIgKoneksi).not.toHaveBeenCalled();
});

it('tidak membocorkan kunci dan identitas akun fasyankes lain', async () => {
    jest.mocked(db.ambilIgKoneksi).mockResolvedValue({ fasyankes_id: 20, status: 'terhubung', username: 'rahasia', api_key: 'secret' });
    const data = await (await fetch(`${url}/koneksi`)).json();
    expect(data.data).toEqual({ status: 'terputus', nomor: null, qr: null, tersedia: false, dikonfigurasi: false, token_berakhir: null });
});

it('membatasi percakapan dan media ke fasyankes peminta', async () => {
    jest.mocked(db.cariIgPercakapanUntukBuatRuteInstagram).mockResolvedValue(null);
    expect((await fetch(`${url}/percakapan/99/pesan`)).status).toBe(404);
    expect(jest.mocked(db.cariIgPercakapanUntukBuatRuteInstagram).mock.calls.map(args => ({ ...args }))).toEqual(expect.arrayContaining([expect.objectContaining({ 0: 99, 1: 10 })]));
});

it('menolak endpoint koneksi lama yang melewati login Meta', async () => {
    jest.mocked(db.ambilIgKoneksi).mockResolvedValue({ fasyankes_id: 10, akun_id: 'pertama' });
    const res = await fetch(`${url}/koneksi`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ aksi: 'hubungkan', akun_id: 'kedua', api_key: 'kunci-uji-cukup-panjang' }) });
    expect(res.status).toBe(400);
});