import { GalatIntegrasi } from '@klira/integrasi';

const { bacaKonfigurasi, buatLayananSatusehat, periksaAlamat, URL_RESMI } = await import("./layanan.js");

const ENV = { SATUSEHAT_ORGANIZATION_ID: 'org-1', SATUSEHAT_CLIENT_ID: 'cid', SATUSEHAT_CLIENT_SECRET: 'sangat-rahasia' };

function buat({ env = ENV, uji } = {}) {
    const klienDibuat = [];
    const l = buatLayananSatusehat({
        env,
        buatKlien: (konfig) => {
            klienDibuat.push(konfig);
            return { uji: uji ?? (async () => ({ ok: true, organisasi: { id: 'org-1', nama: 'Klinik Contoh' } })) };
        },
        sekarang: () => new Date('2026-11-14T08:00:00Z'),
    });
    return { l, klienDibuat };
}

describe('periksaAlamat', () => {
    it('kosong berarti alamat resmi', () => {
        expect(periksaAlamat('', 'sandbox')).toEqual({ ok: true, alamat: null });
        expect(periksaAlamat(null, 'produksi')).toEqual({ ok: true, alamat: null });
    });
    it('menerima http untuk sandbox di pengembangan dan membuang garis miring akhir', () => {
        expect(periksaAlamat('http://localhost:8076/', 'sandbox')).toEqual({ ok: true, alamat: 'http://localhost:8076' });
    });
    it('produksi wajib https', () => {
        expect(periksaAlamat('http://localhost:8076', 'produksi').ok).toBe(false);
        expect(periksaAlamat('https://api-satusehat.kemkes.go.id', 'produksi').ok).toBe(true);
    });
    it('menolak skema selain http/https dan teks bukan URL', () => {
        expect(periksaAlamat('ftp://x.test', 'sandbox').ok).toBe(false);
        expect(periksaAlamat('javascript:alert(1)', 'sandbox').ok).toBe(false);
        expect(periksaAlamat('bukan url', 'sandbox').ok).toBe(false);
    });
    it('di server produksi alamat kustom ditolak kecuali operator mengizinkan, alamat resmi tetap boleh', () => {
        expect(periksaAlamat('http://localhost:8076', 'sandbox', { nodeEnv: 'production' }).ok).toBe(false);
        expect(periksaAlamat('http://localhost:8076', 'sandbox', { nodeEnv: 'production', izinKustom: true }).ok).toBe(true);
        expect(periksaAlamat(URL_RESMI.sandbox, 'sandbox', { nodeEnv: 'production' }).ok).toBe(true);
    });
});

describe('bacaKonfigurasi', () => {
    it('alamat kosong memakai sandbox resmi; spasi dipangkas', () => {
        expect(bacaKonfigurasi({ ...ENV, SATUSEHAT_BASE_URL: '  ', SATUSEHAT_CLIENT_ID: ' cid ' }))
            .toMatchObject({ environment: 'sandbox', baseUrl: URL_RESMI.sandbox, clientId: 'cid', lengkap: true, kurang: [] });
    });
    it('host resmi produksi dikenali sebagai produksi dan wajib https', () => {
        expect(bacaKonfigurasi({ ...ENV, SATUSEHAT_BASE_URL: `${URL_RESMI.produksi}/` })).toMatchObject({ environment: 'produksi', lengkap: true });
        expect(bacaKonfigurasi({ ...ENV, SATUSEHAT_BASE_URL: 'http://api-satusehat.kemkes.go.id' })).toMatchObject({ environment: 'produksi', lengkap: false });
    });
    it('menyebut variabel yang kosong; alamat tidak sah membuat tidak lengkap', () => {
        expect(bacaKonfigurasi({ SATUSEHAT_CLIENT_ID: 'cid' })).toMatchObject({ lengkap: false, kurang: ['SATUSEHAT_ORGANIZATION_ID', 'SATUSEHAT_CLIENT_SECRET'] });
        expect(bacaKonfigurasi({ ...ENV, SATUSEHAT_BASE_URL: 'bukan url' }).lengkap).toBe(false);
    });
});

describe('ambil', () => {
    it('lengkap: lingkungan aktif tanpa membocorkan rahasia', async () => {
        const h = await buat().l.ambil();
        expect(h).toMatchObject({ aktif: 'sandbox', organization_id: 'org-1', client_id: 'cid', client_secret_terisi: true, masalah: null });
        expect(JSON.stringify(h)).not.toContain('sangat-rahasia');
    });
    it('belum lengkap: tidak aktif dan menyebut variabelnya', async () => {
        const h = await buat({ env: {} }).l.ambil();
        expect(h).toMatchObject({ aktif: null, organization_id: null, client_secret_terisi: false });
        expect(h.masalah).toContain('SATUSEHAT_CLIENT_SECRET');
    });
});

describe('uji', () => {
    it('berhasil: klien dibuat dari env dan hasilnya diingat', async () => {
        const { l, klienDibuat } = buat();
        const h = await l.uji();
        expect(klienDibuat[0]).toEqual({ baseUrl: URL_RESMI.sandbox, clientId: 'cid', clientSecret: 'sangat-rahasia', organizationId: 'org-1' });
        expect(h).toMatchObject({ ok: true, data: { berhasil: true, pesan: 'Terhubung ke Klinik Contoh.' } });
        expect(await l.ambil()).toMatchObject({ hasil_uji: 'Terhubung ke Klinik Contoh.', diuji_pada: '2026-11-14T08:00:00.000Z' });
        expect(JSON.stringify(h)).not.toContain('sangat-rahasia');
    });
    it('gagal: pesan layanan diteruskan, galat tak terduga tidak membocorkan rincian', async () => {
        const gagal = buat({ uji: async () => { throw new GalatIntegrasi('Invalid client id or secret', { layanan: 'satusehat', status: 401 }); } });
        expect(await gagal.l.uji()).toMatchObject({ ok: true, data: { berhasil: false, pesan: 'Uji koneksi gagal: Invalid client id or secret' } });
        const aneh = buat({ uji: async () => { throw new Error('ECONNREFUSED 10.0.0.5:443 secret=abc'); } });
        const h = await aneh.l.uji();
        expect(h.data.pesan).toBe('Uji koneksi gagal: kesalahan tak terduga');
        expect(JSON.stringify(h)).not.toContain('10.0.0.5');
    });
    it('menolak bila variabel belum lengkap', async () => {
        expect(await buat({ env: {} }).l.uji()).toMatchObject({ ok: false, kode: 'belum_lengkap', pesan: expect.stringMatching(/SATUSEHAT_/) });
    });
});

describe('klienAktif (untuk modul lain)', () => {
    it('klien dari env, dengan opsi tambahan', async () => {
        const { l, klienDibuat } = buat();
        const aktif = await l.klienAktif({ batasWaktuMs: 5 });
        expect(aktif).toMatchObject({ environment: 'sandbox', organizationId: 'org-1' });
        expect(klienDibuat[0].batasWaktuMs).toBe(5);
    });
    it('null bila belum lengkap', async () => {
        expect(await buat({ env: { ...ENV, SATUSEHAT_ORGANIZATION_ID: '' } }).l.klienAktif()).toBeNull();
    });
});
