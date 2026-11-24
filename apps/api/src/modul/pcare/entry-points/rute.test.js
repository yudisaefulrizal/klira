import { jest } from '@jest/globals';

jest.unstable_mockModule('../../../middleware/auth.js', () => ({ wajibMasuk: () => (req, res, next) => {
        const a = req.headers.authorization;
        if (!a)
            return void res.status(401).end();
        const izin = a === 'penuh' ? ['lihat', 'perbaikan'] : a === 'lihat' ? ['lihat'] : [];
        res.locals.pengguna = { id: 3, izin: izin.map((aksi) => ({ fitur: 'satusehat', aksi, cakupan: 'unit' })) };
        next();
    } }));
const { default: express } = await import("express");
const { buatRutePcare } = await import("./rute.js");
const { panggilTanpaPort } = await import("../../../umum/panggil-tanpa-port.js");

const izin = { catatPenolakan: jest.fn(async () => { }), catatTindakan: jest.fn(async () => { }) };
const layanan = { ambil: jest.fn(), simpan: jest.fn(), aktifkan: jest.fn(), uji: jest.fn() };
const app = express();
app.use(express.json());
app.use(buatRutePcare({}, izin, layanan));
beforeEach(() => jest.clearAllMocks());

const panggil = (metode, jalur, { auth, body } = {}) => panggilTanpaPort(app, { metode, url: jalur, headers: auth ? { authorization: auth } : {}, badan: body && metode !== 'GET' ? body : undefined });
const sah = { environment: 'sandbox', cons_id: '2112121', secret_key: 'sk', user_key: 'uk', username: 'u', password: 'p', app_code: '012' };

describe('izin', () => {
    it('semua rute butuh masuk (401) dan izin (403) tanpa menyentuh layanan', async () => {
        for (const [m, j] of [['GET', '/pcare/konfigurasi'], ['PUT', '/pcare/konfigurasi'], ['POST', '/pcare/konfigurasi/sandbox/aktifkan'], ['POST', '/pcare/konfigurasi/sandbox/uji']]) {
            expect((await panggil(m, j, { body: sah })).status).toBe(401);
            expect((await panggil(m, j, { auth: 'tidak', body: sah })).status).toBe(403);
        }
        expect(Object.values(layanan).every((f) => f.mock.calls.length === 0)).toBe(true);
    });
    it('lihat saja boleh membaca tetapi tidak mengubah, mengaktifkan, atau menguji', async () => {
        layanan.ambil.mockResolvedValue({ lingkungan: [] });
        expect((await panggil('GET', '/pcare/konfigurasi', { auth: 'lihat' })).status).toBe(200);
        expect((await panggil('PUT', '/pcare/konfigurasi', { auth: 'lihat', body: sah })).status).toBe(403);
        expect((await panggil('POST', '/pcare/konfigurasi/sandbox/aktifkan', { auth: 'lihat' })).status).toBe(403);
        expect((await panggil('POST', '/pcare/konfigurasi/sandbox/uji', { auth: 'lihat' })).status).toBe(403);
    });
});

describe('simpan, aktifkan, uji', () => {
    it('meneruskan masukan tervalidasi (rahasia kosong dihilangkan, service_name bawaan)', async () => {
        layanan.simpan.mockResolvedValue({ ok: true, data: {} });
        expect((await panggil('PUT', '/pcare/konfigurasi', { auth: 'penuh', body: { ...sah, secret_key: '', service_name: '' } })).status).toBe(200);
        expect(layanan.simpan.mock.calls[0][1]).toMatchObject({ secret_key: undefined, user_key: 'uk', service_name: 'pcare-rest' });
    });
    it('menolak masukan tidak sah dengan 400 dan rincian', async () => {
        for (const ubah of [{ environment: 'dev' }, { cons_id: '' }, { base_url: 'bukan url' }, { service_name: '../x' }]) {
            const r = await panggil('PUT', '/pcare/konfigurasi', { auth: 'penuh', body: { ...sah, ...ubah } });
            expect(r.status).toBe(400);
            expect((await r.json()).galat.kode).toBe('tidak_valid');
        }
        expect(layanan.simpan).not.toHaveBeenCalled();
    });
    it('kegagalan domain membawa bidang; belum lengkap 409; uji berhasil 200', async () => {
        layanan.simpan.mockResolvedValue({ ok: false, kode: 'tidak_valid', pesan: 'Secret key wajib diisi untuk lingkungan baru.', bidang: 'secret_key' });
        const r = await panggil('PUT', '/pcare/konfigurasi', { auth: 'penuh', body: { ...sah, secret_key: undefined } });
        expect(r.status).toBe(400);
        expect((await r.json()).galat.rincian[0].jalur).toBe('secret_key');
        layanan.aktifkan.mockResolvedValueOnce({ ok: false, kode: 'belum_lengkap', pesan: 'x' });
        expect((await panggil('POST', '/pcare/konfigurasi/sandbox/aktifkan', { auth: 'penuh' })).status).toBe(409);
        layanan.uji.mockResolvedValueOnce({ ok: true, data: { berhasil: true } });
        expect((await panggil('POST', '/pcare/konfigurasi/produksi/uji', { auth: 'penuh' })).status).toBe(200);
        expect((await panggil('POST', '/pcare/konfigurasi/dev/uji', { auth: 'penuh' })).status).toBe(400);
    });
});
