import { buatKlienSatusehat, GalatIntegrasi } from '@klira/integrasi';
import { buatAplikasiSatusehat, KONFIG_SATUSEHAT_BAWAAN } from '../../../../../../dummy-intergrasi/satusehat/satusehat.js';
import { mulaiDummy, tutupDummy, PORT_SATUSEHAT, URL_SATUSEHAT } from '../../../../../../dummy-intergrasi/uji-bantu.js';

const { buatSinkronIhs, BATAS_WAKTU_PENDAFTARAN_MS } = await import("./pasien.js");

const P = { id: 3 };

/** Repositori memori satu pasien. */
function buat({ pasien = { id: 9, nik: '9999000000000001', ihs_number: null }, klien, aktif = true } = {}) {
    const state = pasien ? { ...pasien } : null;
    const catatan = [];
    const panggilanKlien = [];
    const sinkron = buatSinkronIhs({
        repo: {
            pasienUntukSinkron: async (_f, id) => (state && id === state.id ? { ...state } : null),
            isiIhs: async (_f, _id, ihs) => { state.ihs_number = ihs; },
        },
        klienAktif: async (f, opsi) => { panggilanKlien.push([f, opsi]); return aktif ? { environment: 'sandbox', organizationId: 'org', klien } : null; },
        audit: { catat: async (e) => void catatan.push(e) },
    });
    return { sinkron, state, catatan, panggilanKlien };
}
const klienTetap = (hasil) => ({ cariPasienNik: async () => hasil });
const ketemu = klienTetap({ ditemukan: true, id: 'P02478375538', resource: {} });
const tidakKetemu = klienTetap({ ditemukan: false, id: null, resource: null });

describe('buatSinkronIhs (repositori dan klien tiruan)', () => {
    it('mengisi IHS Number, mencatat audit, dan memakai batas waktu pendek', async () => {
        const { sinkron, state, catatan, panggilanKlien } = buat({ klien: ketemu });
        const h = await sinkron(P, 9, { alamat: '::1' });
        expect(h).toMatchObject({ status: 'terhubung', ihs_number: 'P02478375538' });
        expect(state.ihs_number).toBe('P02478375538');
        expect(catatan).toEqual([expect.objectContaining({ aksi: 'perbaikan', entitas: 'pasien', entitas_id: 9, alamat: '::1' })]);
        expect(panggilanKlien[0]).toEqual([1, { batasWaktuMs: BATAS_WAKTU_PENDAFTARAN_MS }]);
        expect(BATAS_WAKTU_PENDAFTARAN_MS).toBeLessThanOrEqual(5000);
    });

    it('NIK tidak dikirim ke audit', async () => {
        const { sinkron, catatan } = buat({ klien: ketemu });
        await sinkron(P, 9);
        expect(JSON.stringify(catatan)).not.toContain('9999000000000001');
    });

    it('sudah punya IHS Number: tidak memanggil SATUSEHAT', async () => {
        const klien = { cariPasienNik: jest_fn() };
        const { sinkron } = buat({ pasien: { id: 9, nik: '9999000000000001', ihs_number: 'P1' }, klien });
        expect(await sinkron(P, 9)).toMatchObject({ status: 'sudah', ihs_number: 'P1' });
        expect(klien.cariPasienNik.dipanggil).toBe(0);
    });

    it('tanpa NIK dilewati; belum dikonfigurasi dilewati', async () => {
        expect(await buat({ pasien: { id: 9, nik: null, ihs_number: null }, klien: ketemu }).sinkron(P, 9)).toMatchObject({ status: 'dilewati', alasan: 'tanpa_nik' });
        expect(await buat({ klien: ketemu, aktif: false }).sinkron(P, 9)).toMatchObject({ status: 'dilewati', alasan: 'belum_dikonfigurasi' });
    });

    it('pasien tidak ada dilewati dengan alasan khusus', async () => {
        expect(await buat({ pasien: null, klien: ketemu }).sinkron(P, 9)).toMatchObject({ status: 'dilewati', alasan: 'pasien_tidak_ada' });
    });

    it('NIK tidak ditemukan: status tidak_ditemukan dan IHS Number tetap kosong', async () => {
        const { sinkron, state } = buat({ klien: tidakKetemu });
        expect(await sinkron(P, 9)).toMatchObject({ status: 'tidak_ditemukan' });
        expect(state.ihs_number).toBeNull();
    });

    it('galat integrasi menjadi status gagal dengan pesan layanan; galat lain tidak dibocorkan; tidak pernah melempar', async () => {
        const a = buat({ klien: { cariPasienNik: async () => { throw new GalatIntegrasi('SATUSEHAT tidak dapat dihubungi.', { layanan: 'satusehat', jaringan: true }); } } });
        expect(await a.sinkron(P, 9)).toEqual({ status: 'gagal', pesan: 'Pencarian di SATUSEHAT gagal: SATUSEHAT tidak dapat dihubungi.' });
        const b = buat({ klien: { cariPasienNik: async () => { throw new Error('ER_ACCESS_DENIED root@10.0.0.9'); } } });
        const h = await b.sinkron(P, 9);
        expect(h.status).toBe('gagal');
        expect(JSON.stringify(h)).not.toContain('10.0.0.9');
    });

    it('paksa: mencari ulang walau ada; ditemukan menimpa, tidak ditemukan mengosongkan, gagal membiarkan', async () => {
        const ada = { id: 9, nik: '9999000000000001', ihs_number: 'LAMA' };
        const a = buat({ pasien: ada, klien: ketemu });
        await a.sinkron(P, 9, { paksa: true });
        expect(a.state.ihs_number).toBe('P02478375538');
        const b = buat({ pasien: ada, klien: tidakKetemu });
        await b.sinkron(P, 9, { paksa: true });
        expect(b.state.ihs_number).toBeNull();
        const c = buat({ pasien: ada, klien: { cariPasienNik: async () => { throw new GalatIntegrasi('x', { layanan: 'satusehat' }); } } });
        await c.sinkron(P, 9, { paksa: true });
        expect(c.state.ihs_number).toBe('LAMA');
    });

    it('nikBerubah: IHS Number lama dihapus lebih dulu walau pencarian gagal', async () => {
        const { sinkron, state, catatan } = buat({ pasien: { id: 9, nik: '9999000000000002', ihs_number: 'MILIK-NIK-LAMA' }, klien: { cariPasienNik: async () => { throw new GalatIntegrasi('x', { layanan: 'satusehat', jaringan: true }); } } });
        const h = await sinkron(P, 9, { nikBerubah: true, paksa: true });
        expect(h.status).toBe('gagal');
        expect(state.ihs_number).toBeNull();
        expect(catatan[0].keterangan).toMatch(/NIK berubah/);
    });
});

/** Penghitung panggilan sederhana tanpa ketergantungan jest di berkas ini. */
function jest_fn() {
    const f = async () => { f.dipanggil += 1; return { ditemukan: false }; };
    f.dipanggil = 0;
    return f;
}

describe('terhadap service-dummy (klien nyata)', () => {
    let server;
    const baseUrl = URL_SATUSEHAT;
    beforeAll(async () => {
        server = await mulaiDummy(buatAplikasiSatusehat(), PORT_SATUSEHAT);
    });
    afterAll(() => tutupDummy(server));
    const klien = () => buatKlienSatusehat({ baseUrl, clientId: KONFIG_SATUSEHAT_BAWAAN.clientId, clientSecret: KONFIG_SATUSEHAT_BAWAAN.clientSecret, organizationId: KONFIG_SATUSEHAT_BAWAAN.organizationId, batasWaktuMs: BATAS_WAKTU_PENDAFTARAN_MS });

    it('NIK terdaftar: IHS Number sesuai data dummy', async () => {
        const { sinkron, state } = buat({ klien: klien() });
        expect(await sinkron(P, 9)).toMatchObject({ status: 'terhubung', ihs_number: 'P02478375538' });
        expect(state.ihs_number).toBe('P02478375538');
    });

    it('NIK tidak terdaftar: tidak ditemukan', async () => {
        const { sinkron } = buat({ pasien: { id: 9, nik: '1111111111111111', ihs_number: null }, klien: klien() });
        expect(await sinkron(P, 9)).toMatchObject({ status: 'tidak_ditemukan' });
    });

    it('kredensial salah: gagal dengan pesan layanan, pendaftaran tidak terganggu', async () => {
        const salah = buatKlienSatusehat({ baseUrl, clientId: 'x', clientSecret: 'y', organizationId: 'z' });
        const { sinkron } = buat({ klien: salah });
        expect(await sinkron(P, 9)).toMatchObject({ status: 'gagal', pesan: expect.stringMatching(/Invalid client/) });
    });
});
