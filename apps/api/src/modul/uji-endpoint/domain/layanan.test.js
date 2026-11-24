import { jest } from '@jest/globals';
import { GalatIntegrasi } from '@klira/integrasi';

const { buatLayananUjiEndpoint } = await import("./layanan.js");

const P = { id: 9 };

function buat({ ss = { environment: 'sandbox', klien: null }, pc = { environment: 'sandbox', klien: null }, auditGagal = false, organisasi = 'org-1' } = {}) {
    const catatan = [];
    const panggilan = [];
    const klienSs = ss && { environment: ss.environment, klien: { kirimMentah: jest.fn(async (a) => { panggilan.push(['ss', a]); return ss.klien ? ss.klien(a) : { status: 200, url: `http://dummy/fhir-r4/v1${a.jalur}`, badan: { resourceType: 'Patient' } }; }) } };
    const klienPc = pc && { environment: pc.environment, klien: { kirimMentah: jest.fn(async (a) => { panggilan.push(['pc', a]); return pc.klien ? pc.klien(a) : { status: 200, url: `http://dummy/pcare-rest${a.jalur}`, metaData: { code: 200, message: 'OK' }, response: { count: 1 }, terbaca: true, gagalDekripsi: false }; }) } };
    let waktu = 1000;
    const l = buatLayananUjiEndpoint({
        layananSatusehat: { ambil: async () => ({ organization_id: organisasi, aktif: ss ? ss.environment : null }), klienAktif: async () => klienSs },
        layananPcare: { ambil: async () => ({ aktif: pc ? pc.environment : null }), klienAktif: async () => klienPc },
        audit: { catat: async (e) => { if (auditGagal) throw new Error('audit gagal'); catatan.push(e); } },
        tick: () => (waktu += 25),
    });
    return { l, catatan, panggilan, klienSs, klienPc };
}
const kirimSs = (ubah = {}) => ({ layanan: 'satusehat', endpoint_id: 'ss-pasien-nik', parameter: { nik: '9999000000000001' }, ...ubah });
const kirimPc = (ubah = {}) => ({ layanan: 'pcare', endpoint_id: 'pc-peserta-noka', parameter: { noKartu: '0000039043765' }, ...ubah });

describe('katalog', () => {
    it('katalog layanan, konteks Organization ID, dan koneksi sandbox boleh diuji', async () => {
        const h = await buat().l.katalog(P, 'pcare');
        expect(h.katalog.every((x) => x.layanan === 'pcare')).toBe(true);
        expect(h.konteks).toEqual({ organization_id: 'org-1' });
        expect(h.koneksi).toEqual({ aktif: 'sandbox', boleh_uji: true, pesan: null });
    });
    it('produksi atau belum aktif: tidak boleh diuji, dengan pesan', async () => {
        const a = await buat({ ss: { environment: 'produksi' } }).l.katalog(P, 'satusehat');
        expect(a.koneksi).toMatchObject({ aktif: 'produksi', boleh_uji: false, pesan: expect.stringMatching(/hanya untuk lingkungan sandbox/) });
        const b = await buat({ pc: null }).l.katalog(P, 'pcare');
        expect(b.koneksi).toMatchObject({ aktif: null, boleh_uji: false, pesan: expect.stringMatching(/Belum ada lingkungan/) });
    });
});

describe('kirim: validasi sebelum menyentuh layanan', () => {
    it('endpoint tidak ada di katalog atau milik layanan lain: 404 tanpa panggilan', async () => {
        const { l, panggilan, catatan } = buat();
        expect(await l.kirim(P, kirimSs({ endpoint_id: 'tidak-ada' }), '::1')).toMatchObject({ ok: false, kode: 'tidak_ditemukan' });
        expect(await l.kirim(P, kirimSs({ endpoint_id: 'pc-ref-dokter' }), '::1')).toMatchObject({ ok: false, kode: 'tidak_ditemukan' });
        expect(panggilan).toEqual([]);
        expect(catatan).toEqual([]);
    });
    it('parameter salah: semua galat dikembalikan, tidak ada audit atau panggilan', async () => {
        const { l, panggilan, catatan } = buat();
        const h = await l.kirim(P, kirimPc({ endpoint_id: 'pc-daftar-nourut', parameter: { noUrut: '', tgl: 'salah' } }), '::1');
        expect(h).toMatchObject({ ok: false, kode: 'tidak_valid' });
        expect(h.rincian.map((r) => r.jalur).sort()).toEqual(['parameter.noUrut', 'parameter.tgl']);
        expect(panggilan).toEqual([]);
        expect(catatan).toEqual([]);
    });
    it('POST/PUT: badan wajib dan harus JSON; GET mengabaikan badan', async () => {
        const { l, panggilan } = buat();
        expect(await l.kirim(P, kirimPc({ endpoint_id: 'pc-daftar-buat', parameter: {} }), '::1')).toMatchObject({ ok: false, kode: 'tidak_valid', rincian: [{ jalur: 'badan' }] });
        expect(await l.kirim(P, kirimPc({ endpoint_id: 'pc-daftar-buat', parameter: {}, badan: '{rusak' }), '::1')).toMatchObject({ ok: false, pesan: expect.stringMatching(/bukan JSON/) });
        expect(panggilan).toEqual([]);
        await l.kirim(P, kirimPc({ badan: 'abaikan saja bukan json' }), '::1');
        expect(panggilan[0][1]).toMatchObject({ metode: 'GET', badan: undefined });
    });
});

describe('kirim: lingkungan', () => {
    it('belum ada lingkungan aktif: 409 tanpa audit', async () => {
        const { l, catatan } = buat({ ss: null });
        expect(await l.kirim(P, kirimSs(), '::1')).toMatchObject({ ok: false, kode: 'belum_lengkap' });
        expect(catatan).toEqual([]);
    });
    it('PRODUKSI DITOLAK untuk kedua layanan: tidak ada panggilan dan tidak ada audit', async () => {
        const { l, panggilan, catatan } = buat({ ss: { environment: 'produksi' }, pc: { environment: 'produksi' } });
        expect(await l.kirim(P, kirimSs(), '::1')).toMatchObject({ ok: false, kode: 'dilarang', pesan: expect.stringMatching(/produksi/) });
        expect(await l.kirim(P, kirimPc(), '::1')).toMatchObject({ ok: false, kode: 'dilarang' });
        expect(panggilan).toEqual([]);
        expect(catatan).toEqual([]);
    });
});

describe('kirim: berhasil', () => {
    it('SATUSEHAT: jalur dari katalog, dasar fhir/kfa, hasil dengan durasi', async () => {
        const { l, panggilan } = buat();
        const h = await l.kirim(P, kirimSs(), '::1');
        expect(panggilan[0][1]).toEqual({ metode: 'GET', jalur: '/Patient?identifier=https%3A%2F%2Ffhir.kemkes.go.id%2Fid%2Fnik%7C9999000000000001', badan: undefined, dasar: 'fhir' });
        expect(h).toMatchObject({ ok: true, data: { permintaan: { metode: 'GET', environment: 'sandbox', url: expect.stringContaining('/fhir-r4/v1/Patient') }, respons: { status: 200, durasi_ms: 25 }, galat: null } });
        await l.kirim(P, kirimSs({ endpoint_id: 'ss-kfa-kode', parameter: { kode: '93000108' } }), '::1');
        expect(panggilan[1][1].dasar).toBe('kfa');
    });
    it('PCare: respons terdekripsi dan metaData diteruskan; badan POST di-parse', async () => {
        const { l, panggilan } = buat();
        const h = await l.kirim(P, kirimPc(), '::1');
        expect(h.data.respons).toMatchObject({ status: 200, terbaca: true, gagal_dekripsi: false, meta_data: { code: 200 }, badan: { count: 1 } });
        expect(panggilan[0][1]).not.toHaveProperty('dasar');
        await l.kirim(P, kirimPc({ endpoint_id: 'pc-daftar-buat', parameter: {}, badan: '{"noKartu":"1"}' }), '::1');
        expect(panggilan[1][1]).toMatchObject({ metode: 'POST', jalur: '/pendaftaran', badan: { noKartu: '1' } });
    });
    it('status galat dari layanan (404, 412) tetap hasil yang ditampilkan, bukan kegagalan alat', async () => {
        const { l } = buat({ ss: { environment: 'sandbox', klien: async () => ({ status: 404, url: 'u', badan: { resourceType: 'OperationOutcome' } }) } });
        expect((await l.kirim(P, kirimSs(), '::1')).data.respons).toMatchObject({ status: 404, badan: { resourceType: 'OperationOutcome' } });
    });
    it('respons besar dipotong', async () => {
        const { l } = buat({ ss: { environment: 'sandbox', klien: async () => ({ status: 200, url: 'u', badan: { besar: 'x'.repeat(600_000) } }) } });
        const h = await l.kirim(P, kirimSs(), '::1');
        expect(h.data.respons.badan).toMatchObject({ _dipotong: expect.any(String) });
        expect(JSON.stringify(h).length).toBeLessThan(10_000);
    });
});

describe('kirim: audit', () => {
    it('dicatat sebelum kirim tanpa parameter atau badan (tidak ada NIK di log)', async () => {
        const { l, catatan } = buat();
        await l.kirim(P, kirimSs(), '::1');
        expect(catatan).toEqual([expect.objectContaining({ aksi: 'input', entitas: 'test_endpoint', keterangan: 'satusehat ss-pasien-nik GET (sandbox)', alamat: '::1', pengguna_id: 9 })]);
        expect(JSON.stringify(catatan)).not.toContain('9999000000000001');
    });
    it('audit gagal berarti permintaan TIDAK dikirim', async () => {
        const { l, panggilan } = buat({ auditGagal: true });
        await expect(l.kirim(P, kirimSs(), '::1')).rejects.toThrow('audit gagal');
        expect(panggilan).toEqual([]);
    });
});

describe('kirim: kegagalan layanan', () => {
    it('jaringan putus: hasil tetap ok dengan pesan galat, tanpa rincian internal', async () => {
        const { l } = buat({ pc: { environment: 'sandbox', klien: async () => { throw new GalatIntegrasi('PCare tidak dapat dihubungi. Coba lagi sebentar lagi.', { layanan: 'pcare', jaringan: true }); } } });
        const h = await l.kirim(P, kirimPc(), '::1');
        expect(h).toMatchObject({ ok: true, data: { respons: null, galat: 'PCare tidak dapat dihubungi. Coba lagi sebentar lagi.' } });
    });
    it('galat tak terduga tidak dibocorkan', async () => {
        const { l } = buat({ pc: { environment: 'sandbox', klien: async () => { throw new Error('ECONNREFUSED 10.0.0.5 kunci=abc'); } } });
        const h = await l.kirim(P, kirimPc(), '::1');
        expect(h.data.galat).toMatch(/tak terduga/);
        expect(JSON.stringify(h)).not.toMatch(/10\.0\.0\.5|abc/);
    });
});
