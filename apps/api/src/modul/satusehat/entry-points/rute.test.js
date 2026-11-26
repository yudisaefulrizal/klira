import { jest } from '@jest/globals';

jest.unstable_mockModule('../../../middleware/auth.js', () => ({ wajibMasuk: () => (req, res, next) => {
        const a = req.headers.authorization;
        if (!a)
            return void res.status(401).end();
        const izin = a === 'penuh' ? ['lihat', 'perbaikan'] : a === 'lihat' ? ['lihat'] : [];
        const fitur = a === 'pendaftaran' ? 'pasien' : 'satusehat';
        res.locals.pengguna = { id: 3, izin: (a === 'pendaftaran' ? ['perbaikan'] : izin).map((aksi) => ({ fitur, aksi, cakupan: 'unit' })) };
        next();
    } }));
const { default: express } = await import("express");
const { buatRuteSatusehat } = await import("./rute.js");
const { panggilTanpaPort } = await import("../../../umum/panggil-tanpa-port.js");

const izin = { catatPenolakan: jest.fn(async () => { }), catatTindakan: jest.fn(async () => { }) };
const layanan = { ambil: jest.fn(), uji: jest.fn() };
const sinkronIhs = jest.fn();

// Tanpa port: aplikasi dipanggil langsung di memori.
const app = express();
app.use(express.json());
app.use(buatRuteSatusehat({}, izin, layanan, sinkronIhs));

beforeEach(() => jest.clearAllMocks());

const panggil = (metode, jalur, { auth, body } = {}) => panggilTanpaPort(app, {
    metode,
    url: jalur,
    headers: auth ? { authorization: auth } : {},
    badan: body && metode !== 'GET' ? body : undefined,
});
describe('izin', () => {
    it('semua rute butuh masuk (401) dan izin satusehat (403) tanpa menyentuh layanan', async () => {
        for (const [m, j] of [['GET', '/satusehat/konfigurasi'], ['POST', '/satusehat/konfigurasi/uji']]) {
            expect((await panggil(m, j)).status).toBe(401);
            expect((await panggil(m, j, { auth: 'tidak' })).status).toBe(403);
        }
        expect(Object.values(layanan).every((f) => f.mock.calls.length === 0)).toBe(true);
    });

    it('izin lihat saja boleh membaca tetapi tidak boleh menguji', async () => {
        layanan.ambil.mockResolvedValue({});
        expect((await panggil('GET', '/satusehat/konfigurasi', { auth: 'lihat' })).status).toBe(200);
        expect((await panggil('POST', '/satusehat/konfigurasi/uji', { auth: 'lihat' })).status).toBe(403);
    });
});

describe('uji', () => {
    it('belum lengkap menjadi 409; berhasil 200', async () => {
        layanan.uji.mockResolvedValueOnce({ ok: false, kode: 'belum_lengkap', pesan: 'x' });
        expect((await panggil('POST', '/satusehat/konfigurasi/uji', { auth: 'penuh' })).status).toBe(409);
        layanan.uji.mockResolvedValueOnce({ ok: true, data: { berhasil: true, pesan: 'Terhubung.' } });
        expect((await panggil('POST', '/satusehat/konfigurasi/uji', { auth: 'penuh' })).status).toBe(200);
    });
});

describe('cari ulang IHS Number pasien', () => {
    it('butuh masuk; izin satusehat perbaikan ATAU pasien perbaikan; lihat saja ditolak', async () => {
        expect((await panggil('POST', '/satusehat/pasien/9/ihs')).status).toBe(401);
        expect((await panggil('POST', '/satusehat/pasien/9/ihs', { auth: 'lihat' })).status).toBe(403);
        expect(sinkronIhs).not.toHaveBeenCalled();
    });
    it('petugas pendaftaran (pasien perbaikan) boleh; pencarian dipaksa dan hasil dikembalikan', async () => {
        sinkronIhs.mockResolvedValue({ status: 'terhubung', ihs_number: 'P1', pesan: 'Pasien ditemukan di SATUSEHAT.' });
        const r = await panggil('POST', '/satusehat/pasien/9/ihs', { auth: 'pendaftaran' });
        expect(r.status).toBe(200);
        expect((await r.json()).data.status).toBe('terhubung');
        expect(sinkronIhs).toHaveBeenCalledWith(expect.objectContaining({ id: 3 }), 9, expect.objectContaining({ paksa: true }));
        expect((await panggil('POST', '/satusehat/pasien/9/ihs', { auth: 'penuh' })).status).toBe(200);
    });
    it('id bukan angka dan pasien tidak ada memberi 404', async () => {
        expect((await panggil('POST', '/satusehat/pasien/abc/ihs', { auth: 'penuh' })).status).toBe(404);
        sinkronIhs.mockResolvedValue({ status: 'dilewati', alasan: 'pasien_tidak_ada', pesan: '' });
        expect((await panggil('POST', '/satusehat/pasien/999/ihs', { auth: 'penuh' })).status).toBe(404);
    });
});
