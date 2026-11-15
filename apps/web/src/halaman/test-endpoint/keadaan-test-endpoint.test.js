import { KATALOG_ENDPOINT } from '@klira/shared';
import { bentukKirim, formAwal, formatJson, galatForm, isianParameter, kelompokkan, nadaStatus, pulihkanBadan, ringkasHasil, ringkasKoneksi, ubahBadan, ubahParameter } from './keadaan-test-endpoint.js';

const ambil = (id) => KATALOG_ENDPOINT.find((x) => x.id === id);

describe('kelompokkan', () => {
    it('mengelompokkan menurut kelompok dengan urutan kemunculan', () => {
        const g = kelompokkan(KATALOG_ENDPOINT.filter((x) => x.layanan === 'pcare'));
        expect(g.map((x) => x.kelompok).slice(0, 3)).toEqual(['Peserta', 'Pendaftaran', 'Kunjungan']);
        expect(g.flatMap((x) => x.isi)).toHaveLength(KATALOG_ENDPOINT.filter((x) => x.layanan === 'pcare').length);
    });
});

describe('formAwal dan ubah', () => {
    it('parameter terisi contoh dengan konteks klinik; badan contoh sesuai', () => {
        const f = formAwal(ambil('ss-organisasi-id'), { organization_id: 'org-9' });
        expect(f.parameter).toEqual({ id: 'org-9' });
        expect(f.badan).toBe('');
        const e = formAwal(ambil('ss-encounter-buat'), { organization_id: 'org-9' });
        expect(JSON.parse(e.badan).serviceProvider.reference).toBe('Organization/org-9');
    });
    it('contoh badan mengikuti parameter sampai badan diedit manual', () => {
        const x = ambil('ss-encounter-ubah');
        let f = formAwal(x, { organization_id: 'o' });
        f = ubahParameter(x, f, 'id', 'ENC-1', { organization_id: 'o' });
        expect(JSON.parse(f.badan).id).toBe('ENC-1');
        f = ubahBadan(f, '{"id":"saya-ubah"}');
        f = ubahParameter(x, f, 'id', 'ENC-2', { organization_id: 'o' });
        expect(f.badan).toBe('{"id":"saya-ubah"}');
        f = pulihkanBadan(x, f, { organization_id: 'o' });
        expect(JSON.parse(f.badan).id).toBe('ENC-2');
        expect(f.badanDiubah).toBe(false);
    });
    it('start dan limit hanya untuk endpoint berhalaman', () => {
        const x = ambil('pc-ref-dokter');
        let f = formAwal(x);
        f = ubahParameter(x, f, 'start', '0');
        f = ubahParameter(x, f, 'limit', '10');
        expect(isianParameter(x, f)).toEqual({ start: '0', limit: '10' });
        expect(isianParameter(ambil('pc-ref-kesadaran'), formAwal(ambil('pc-ref-kesadaran')))).toEqual({});
    });
});

describe('galatForm', () => {
    it('contoh bawaan semua endpoint tanpa kekurangan kecuali id yang memang harus diisi', () => {
        const harusDiisi = new Set(['ss-encounter-id', 'ss-encounter-ubah', 'ss-condition-id']);
        for (const x of KATALOG_ENDPOINT) {
            const g = galatForm(x, formAwal(x, { organization_id: 'org-1' }));
            expect([x.id, harusDiisi.has(x.id) ? Object.keys(g).length > 0 : Object.keys(g).length]).toEqual([x.id, harusDiisi.has(x.id) ? true : 0]);
        }
    });
    it('parameter wajib dan pola memakai kunci parameter.nama', () => {
        const x = ambil('ss-pasien-nik');
        expect(galatForm(x, { ...formAwal(x), parameter: { nik: '123' } })['parameter.nik']).toBe('NIK harus 16 digit.');
        expect(galatForm(x, { ...formAwal(x), parameter: { nik: '' } })['parameter.nik']).toMatch(/wajib/);
    });
    it('badan POST wajib dan harus JSON; GET tanpa kunci badan', () => {
        const x = ambil('pc-daftar-buat');
        expect(galatForm(x, { ...formAwal(x), badan: '' }).badan).toMatch(/wajib/);
        expect(galatForm(x, { ...formAwal(x), badan: '{x' }).badan).toMatch(/bukan JSON/);
        expect(galatForm(ambil('pc-ref-kesadaran'), formAwal(ambil('pc-ref-kesadaran')))).toEqual({});
    });
});

describe('bentukKirim', () => {
    it('membuang isian kosong dan menyertakan badan hanya untuk POST/PUT', () => {
        const x = ambil('pc-ref-dokter');
        expect(bentukKirim('pcare', x, formAwal(x))).toEqual({ layanan: 'pcare', endpoint_id: 'pc-ref-dokter', parameter: {} });
        const g = ambil('pc-daftar-buat');
        const m = bentukKirim('pcare', g, formAwal(g));
        expect(m).toMatchObject({ layanan: 'pcare', endpoint_id: 'pc-daftar-buat', parameter: {} });
        expect(JSON.parse(m.badan).noKartu).toBe('0000039043765');
    });
});

describe('tampilan hasil', () => {
    it('nadaStatus: 2xx hijau, 4xx kuning, 5xx merah', () => {
        expect([200, 201, 404, 412, 500, 504].map(nadaStatus)).toEqual(['hijau', 'hijau', 'kuning', 'kuning', 'merah', 'merah']);
    });
    it('ringkasKoneksi', () => {
        expect(ringkasKoneksi({ aktif: 'sandbox', boleh_uji: true, pesan: null }).nada).toBe('hijau');
        expect(ringkasKoneksi({ aktif: 'produksi', boleh_uji: false, pesan: 'x' })).toEqual({ nada: 'merah', teks: 'x' });
        expect(ringkasKoneksi({ aktif: null, boleh_uji: false, pesan: 'y' })).toEqual({ nada: 'kuning', teks: 'y' });
    });
    it('SATUSEHAT: badan apa adanya dengan permintaan', () => {
        const r = ringkasHasil('satusehat', { galat: null, permintaan: { metode: 'GET', jalur: '/Patient/P1', url: 'http://d/fhir-r4/v1/Patient/P1' }, respons: { status: 200, durasi_ms: 12, badan: { resourceType: 'Patient' } } });
        expect(r).toMatchObject({ nada: 'hijau', status: 200, durasi: 12, catatan: [], permintaan: 'GET http://d/fhir-r4/v1/Patient/P1' });
        expect(JSON.parse(r.respons)).toEqual({ resourceType: 'Patient' });
    });
    it('PCare: metaData dan catatan dekripsi; POST menampilkan badan permintaan', () => {
        const r = ringkasHasil('pcare', { galat: null, permintaan: { metode: 'POST', jalur: '/pendaftaran', url: 'http://d/pcare-rest/pendaftaran', badan: { a: 1 } }, respons: { status: 412, durasi_ms: 5, terbaca: true, gagal_dekripsi: true, meta_data: { code: 412, message: 'PRECONDITION FAILED' }, badan: 'mentah' } });
        expect(r.nada).toBe('kuning');
        expect(r.catatan).toEqual(['PCare: 412 PRECONDITION FAILED', expect.stringMatching(/tidak dapat didekripsi/)]);
        expect(r.permintaan).toBe(`POST http://d/pcare-rest/pendaftaran\n\n${formatJson({ a: 1 })}`);
    });
    it('galat layanan menjadi catatan merah tanpa respons', () => {
        const r = ringkasHasil('pcare', { galat: 'PCare tidak dapat dihubungi.', durasi_ms: 3, permintaan: { metode: 'GET', jalur: '/kesadaran' }, respons: null });
        expect(r).toMatchObject({ nada: 'merah', status: null, catatan: ['PCare tidak dapat dihubungi.'], respons: '', permintaan: 'GET /kesadaran' });
    });
});
