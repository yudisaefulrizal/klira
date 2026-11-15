import { jest } from '@jest/globals';

jest.unstable_mockModule('../../../middleware/auth.js', () => ({ wajibMasuk: () => (req, res, next) => {
        const a = req.headers.authorization;
        if (!a)
            return void res.status(401).end();
        const izin = a === 'penuh' ? ['lihat', 'perbaikan'] : a === 'lihat' ? ['lihat'] : [];
        const fitur = a === 'pendaftaran' ? 'pasien' : 'satusehat';
        res.locals.pengguna = { id: 3, fasyankes_id: 7, izin: (a === 'pendaftaran' ? ['perbaikan'] : izin).map((aksi) => ({ fitur, aksi, cakupan: 'unit' })) };
        next();
    } }));
const { default: express } = await import("express");
const { buatRuteSatusehat } = await import("./rute.js");
const { panggilTanpaPort } = await import("../../../umum/panggil-tanpa-port.js");

const izin = { catatPenolakan: jest.fn(async () => { }), catatTindakan: jest.fn(async () => { }) };
const layanan = { ambil: jest.fn(), simpan: jest.fn(), aktifkan: jest.fn(), uji: jest.fn() };
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
const sah = { environment: 'sandbox', client_id: 'cid', client_secret: 'rahasia' };

describe('izin', () => {
    it('semua rute butuh masuk (401) dan izin satusehat (403) tanpa menyentuh layanan', async () => {
        const rute = [['GET', '/satusehat/konfigurasi'], ['PUT', '/satusehat/konfigurasi'], ['POST', '/satusehat/konfigurasi/sandbox/aktifkan'], ['POST', '/satusehat/konfigurasi/sandbox/uji']];
        for (const [m, j] of rute) {
            expect((await panggil(m, j, { body: sah })).status).toBe(401);
            expect((await panggil(m, j, { auth: 'tidak', body: sah })).status).toBe(403);
        }
        expect(Object.values(layanan).every((f) => f.mock.calls.length === 0)).toBe(true);
    });

    it('izin lihat saja boleh membaca tetapi tidak boleh mengubah, mengaktifkan, atau menguji', async () => {
        layanan.ambil.mockResolvedValue({ lingkungan: [] });
        expect((await panggil('GET', '/satusehat/konfigurasi', { auth: 'lihat' })).status).toBe(200);
        expect((await panggil('PUT', '/satusehat/konfigurasi', { auth: 'lihat', body: sah })).status).toBe(403);
        expect((await panggil('POST', '/satusehat/konfigurasi/sandbox/aktifkan', { auth: 'lihat' })).status).toBe(403);
        expect((await panggil('POST', '/satusehat/konfigurasi/sandbox/uji', { auth: 'lihat' })).status).toBe(403);
    });
});

describe('simpan', () => {
    it('meneruskan masukan tervalidasi bersama pengguna', async () => {
        layanan.simpan.mockResolvedValue({ ok: true, data: { environment: 'sandbox' } });
        const r = await panggil('PUT', '/satusehat/konfigurasi', { auth: 'penuh', body: { ...sah, client_secret: '', base_url: '' } });
        expect(r.status).toBe(200);
        const [pengguna, masukan] = layanan.simpan.mock.calls[0];
        expect(pengguna).toMatchObject({ id: 3, fasyankes_id: 7 });
        expect(masukan).toEqual({ environment: 'sandbox', client_id: 'cid', client_secret: undefined, base_url: undefined });
    });

    it('menolak lingkungan tak dikenal, client_id kosong, dan alamat bukan URL', async () => {
        for (const ubah of [{ environment: 'dev' }, { client_id: ' ' }, { base_url: 'bukan url' }]) {
            const r = await panggil('PUT', '/satusehat/konfigurasi', { auth: 'penuh', body: { ...sah, ...ubah } });
            expect(r.status).toBe(400);
            expect((await r.json()).galat.kode).toBe('tidak_valid');
        }
        expect(layanan.simpan).not.toHaveBeenCalled();
    });

    it('kegagalan domain menjadi 400 dengan rincian bidang', async () => {
        layanan.simpan.mockResolvedValue({ ok: false, kode: 'tidak_valid', pesan: 'Client secret wajib diisi untuk lingkungan baru.', bidang: 'client_secret' });
        const r = await panggil('PUT', '/satusehat/konfigurasi', { auth: 'penuh', body: { environment: 'sandbox', client_id: 'cid' } });
        expect(r.status).toBe(400);
        expect((await r.json()).galat.rincian).toEqual([{ jalur: 'client_secret', pesan: 'Client secret wajib diisi untuk lingkungan baru.' }]);
    });
});

describe('aktifkan dan uji', () => {
    it('lingkungan tak dikenal ditolak 400', async () => {
        expect((await panggil('POST', '/satusehat/konfigurasi/dev/aktifkan', { auth: 'penuh' })).status).toBe(400);
        expect((await panggil('POST', '/satusehat/konfigurasi/dev/uji', { auth: 'penuh' })).status).toBe(400);
    });
    it('belum lengkap menjadi 409; berhasil 200', async () => {
        layanan.aktifkan.mockResolvedValueOnce({ ok: false, kode: 'belum_lengkap', pesan: 'x' });
        expect((await panggil('POST', '/satusehat/konfigurasi/sandbox/aktifkan', { auth: 'penuh' })).status).toBe(409);
        layanan.uji.mockResolvedValueOnce({ ok: true, data: { berhasil: true, pesan: 'Terhubung.' } });
        const r = await panggil('POST', '/satusehat/konfigurasi/produksi/uji', { auth: 'penuh' });
        expect(r.status).toBe(200);
        expect(layanan.uji.mock.calls[0][1]).toBe('produksi');
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
        expect(sinkronIhs).toHaveBeenCalledWith(expect.objectContaining({ fasyankes_id: 7 }), 9, expect.objectContaining({ paksa: true }));
        expect((await panggil('POST', '/satusehat/pasien/9/ihs', { auth: 'penuh' })).status).toBe(200);
    });
    it('id bukan angka dan pasien tidak ada memberi 404', async () => {
        expect((await panggil('POST', '/satusehat/pasien/abc/ihs', { auth: 'penuh' })).status).toBe(404);
        sinkronIhs.mockResolvedValue({ status: 'dilewati', alasan: 'pasien_tidak_ada', pesan: '' });
        expect((await panggil('POST', '/satusehat/pasien/999/ihs', { auth: 'penuh' })).status).toBe(404);
    });
});
