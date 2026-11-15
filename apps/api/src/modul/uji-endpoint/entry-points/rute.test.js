import { jest } from '@jest/globals';

jest.unstable_mockModule('../../../middleware/auth.js', () => ({ wajibMasuk: () => (req, res, next) => {
        const a = req.headers.authorization;
        if (!a)
            return void res.status(401).end();
        const izin = a === 'penuh' ? ['lihat', 'perbaikan'] : a === 'lihat' ? ['lihat'] : [];
        res.locals.pengguna = { id: 3, fasyankes_id: 7, izin: izin.map((aksi) => ({ fitur: 'satusehat', aksi, cakupan: 'unit' })) };
        next();
    } }));
const { default: express } = await import("express");
const { buatRuteUjiEndpoint } = await import("./rute.js");
const { panggilTanpaPort } = await import("../../../umum/panggil-tanpa-port.js");

const izin = { catatPenolakan: jest.fn(async () => { }), catatTindakan: jest.fn(async () => { }) };
const layanan = { katalog: jest.fn(), kirim: jest.fn() };
const app = express();
app.use(express.json());
app.use(buatRuteUjiEndpoint({}, izin, layanan));
beforeEach(() => jest.clearAllMocks());

const panggil = (metode, jalur, { auth, body } = {}) => panggilTanpaPort(app, { metode, url: jalur, headers: auth ? { authorization: auth } : {}, badan: body && metode !== 'GET' ? body : undefined });
const sah = { layanan: 'pcare', endpoint_id: 'pc-ref-dokter', parameter: {} };

describe('izin', () => {
    it('masuk (401) dan izin (403) untuk katalog dan kirim tanpa menyentuh layanan', async () => {
        for (const [m, j] of [['GET', '/test-endpoint/pcare/katalog'], ['POST', '/test-endpoint/kirim']]) {
            expect((await panggil(m, j, { body: sah })).status).toBe(401);
            expect((await panggil(m, j, { auth: 'tidak', body: sah })).status).toBe(403);
        }
        expect(layanan.katalog).not.toHaveBeenCalled();
        expect(layanan.kirim).not.toHaveBeenCalled();
    });
    it('lihat saja boleh membaca katalog tetapi tidak mengirim', async () => {
        layanan.katalog.mockResolvedValue({ katalog: [] });
        expect((await panggil('GET', '/test-endpoint/satusehat/katalog', { auth: 'lihat' })).status).toBe(200);
        expect((await panggil('POST', '/test-endpoint/kirim', { auth: 'lihat', body: sah })).status).toBe(403);
        expect(layanan.kirim).not.toHaveBeenCalled();
    });
});

describe('katalog', () => {
    it('layanan tak dikenal 404', async () => {
        expect((await panggil('GET', '/test-endpoint/bpjs/katalog', { auth: 'penuh' })).status).toBe(404);
        expect(layanan.katalog).not.toHaveBeenCalled();
    });
});

describe('kirim', () => {
    it('meneruskan masukan tervalidasi bersama pengguna', async () => {
        layanan.kirim.mockResolvedValue({ ok: true, data: { respons: { status: 200 } } });
        const r = await panggil('POST', '/test-endpoint/kirim', { auth: 'penuh', body: { ...sah, parameter: { start: '0', limit: '5' }, badan: undefined } });
        expect(r.status).toBe(200);
        expect(layanan.kirim.mock.calls[0][1]).toEqual({ layanan: 'pcare', endpoint_id: 'pc-ref-dokter', parameter: { start: '0', limit: '5' } });
        expect(layanan.kirim.mock.calls[0][0]).toMatchObject({ id: 3, fasyankes_id: 7 });
    });
    it('menolak masukan tidak sah (layanan, id kosong, parameter bukan teks, badan terlalu besar) dengan 400', async () => {
        for (const ubah of [{ layanan: 'lain' }, { endpoint_id: '' }, { parameter: { a: 1 } }, { parameter: 'x' }, { badan: 'x'.repeat(90001) }]) {
            const r = await panggil('POST', '/test-endpoint/kirim', { auth: 'penuh', body: { ...sah, ...ubah } });
            expect([ubah, r.status]).toEqual([ubah, 400]);
        }
        expect(layanan.kirim).not.toHaveBeenCalled();
    });
    it('kode kegagalan domain menjadi status HTTP yang sesuai', async () => {
        for (const [kode, status] of [['tidak_valid', 400], ['tidak_ditemukan', 404], ['belum_lengkap', 409], ['dilarang', 403]]) {
            layanan.kirim.mockResolvedValueOnce({ ok: false, kode, pesan: 'x', rincian: [{ jalur: 'parameter.a', pesan: 'x' }] });
            const r = await panggil('POST', '/test-endpoint/kirim', { auth: 'penuh', body: sah });
            expect([kode, r.status]).toEqual([kode, status]);
            expect((await r.json()).galat.rincian[0].jalur).toBe('parameter.a');
        }
    });
});
