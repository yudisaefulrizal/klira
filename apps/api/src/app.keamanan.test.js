import { jest } from '@jest/globals';

const { buatApp } = await import('./app.js');
const { panggilTanpaPort } = await import('./umum/panggil-tanpa-port.js');

const pimpinan = { id: 7, fasyankes_id: 3, username: 'pimpinan', wajib_ganti_kredensial: false, izin: [{ fitur: 'akses', aksi: 'perbaikan', cakupan: 'unit' }] };
const layananIzin = { catatPenolakan: jest.fn(async () => { }), catatTindakan: jest.fn(async () => []) };

function siapkan({ pengguna = null, ...opsi } = {}) {
    const layananAkses = { saya: jest.fn(async () => pengguna), masuk: jest.fn(async () => ({ ok: false, alasan: 'salah' })) };
    return { layananAkses, app: buatApp(undefined, { layananAkses, layananIzin, ...opsi }) };
}

describe('badan permintaan diurai setelah autentikasi', () => {
    it('kirim pesan tanpa sesi ditolak 401 tanpa mengurai badan', async () => {
        const { app } = siapkan();
        for (const kanal of ['whatsapp', 'instagram']) {
            const res = await panggilTanpaPort(app, { metode: 'POST', url: `/api/${kanal}/percakapan/1/pesan`, badan: '{rusak' });
            expect(res.status).toBe(401);
        }
    });
    it('rute lain menolak badan di atas 100 KB sebagai kesalahan klien', async () => {
        const { app } = siapkan();
        const res = await panggilTanpaPort(app, { metode: 'POST', url: '/api/whatsapp/koneksi', badan: { aksi: 'x'.repeat(200_000) } });
        expect(res.status).toBe(413);
        expect(await res.json()).toHaveProperty('galat.kode', 'terlalu_besar');
    });
});

describe('alamat klien hanya diambil dari proxy tepercaya', () => {
    const masuk = (app, alamatSoket) => panggilTanpaPort(app, {
        metode: 'POST', url: '/api/masuk', alamatSoket, headers: { 'x-forwarded-for': '203.0.113.9' }, badan: { username: 'siapa', kata_sandi: 'apa-saja' },
    });
    it('X-Forwarded-For dari sambungan langsung diabaikan', async () => {
        const { app, layananAkses } = siapkan();
        await masuk(app, '198.51.100.7');
        expect(layananAkses.masuk).toHaveBeenCalledWith('siapa', 'apa-saja', '198.51.100.7');
    });
    it('X-Forwarded-For dari proxy di host yang sama dipakai', async () => {
        const { app, layananAkses } = siapkan();
        await masuk(app, '127.0.0.1');
        expect(layananAkses.masuk).toHaveBeenCalledWith('siapa', 'apa-saja', '203.0.113.9');
    });
    it('jumlah hop dari TRUST_PROXY dihormati', async () => {
        const { app, layananAkses } = siapkan({ trustProxy: 1 });
        await masuk(app, '198.51.100.7');
        expect(layananAkses.masuk).toHaveBeenCalledWith('siapa', 'apa-saja', '203.0.113.9');
    });
});

describe('pulihkan dan reset lewat web', () => {
    it('mati secara bawaan walau pengguna berizin', async () => {
        const { app } = siapkan({ pengguna: pimpinan, pulihkanLewatWeb: false });
        const pulih = await panggilTanpaPort(app, { metode: 'POST', url: '/api/cadangan/pulihkan', headers: { 'content-type': 'application/octet-stream' }, badan: '-- MySQL dump' });
        expect(pulih.status).toBe(403);
        expect(await pulih.json()).toHaveProperty('galat.kode', 'dinonaktifkan');
        const reset = await panggilTanpaPort(app, { metode: 'POST', url: '/api/cadangan/reset', badan: { konfirmasi: 'RESET' } });
        expect(reset.status).toBe(403);
    });
    it('saat hidup, operasi diteruskan ke layanan cadangan dengan pelaku dan alamatnya', async () => {
        const layananCadangan = { lewatWeb: true, pulihkan: jest.fn(async () => { }), reset: jest.fn(async () => { }) };
        const { app } = siapkan({ pengguna: pimpinan, layananCadangan });
        const reset = await panggilTanpaPort(app, { metode: 'POST', url: '/api/cadangan/reset', badan: { konfirmasi: 'RESET' }, alamatSoket: '198.51.100.7' });
        expect(reset.status).toBe(200);
        expect(layananCadangan.reset).toHaveBeenCalledWith(pimpinan, '198.51.100.7');
    });
    it('unggahan yang mengaku lebih besar dari batas ditolak sebelum dibaca', async () => {
        const layananCadangan = { lewatWeb: true, pulihkan: jest.fn(async () => { }) };
        const { app } = siapkan({ pengguna: pimpinan, layananCadangan });
        const app2 = (req, res, next) => { req.headers['content-length'] = String(600 * 1024 * 1024); app.handle(req, res, next); };
        const res = await panggilTanpaPort({ handle: app2 }, { metode: 'POST', url: '/api/cadangan/pulihkan', headers: { 'content-type': 'application/octet-stream' }, badan: 'x' });
        expect(res.status).toBe(413);
        expect(layananCadangan.pulihkan).not.toHaveBeenCalled();
    });
    it('tanpa izin akses tetap ditolak', async () => {
        const { app } = siapkan({ pengguna: { ...pimpinan, izin: [] }, pulihkanLewatWeb: true });
        const res = await panggilTanpaPort(app, { metode: 'POST', url: '/api/cadangan/reset', badan: { konfirmasi: 'RESET' } });
        expect(res.status).toBe(403);
        expect(await res.json()).toHaveProperty('galat.kode', 'tidak_berizin');
    });
});

describe('header keamanan HTTP', () => {
    it('menyertakan header keamanan dasar tanpa x-powered-by', async () => {
        const { app } = siapkan();
        const res = await panggilTanpaPort(app, { metode: 'GET', url: '/api/kesehatan' });
        expect(res.status).toBe(200);
        expect(res.headers['x-powered-by']).toBeUndefined();
        expect(res.headers['x-content-type-options']).toBe('nosniff');
        expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
        expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
        expect(res.headers['permissions-policy']).toBe('camera=(), microphone=(), geolocation=()');
        expect(res.headers['cross-origin-opener-policy']).toBe('same-origin');
        expect(res.headers['strict-transport-security']).toBeUndefined();
    });
    it('mengirim HSTS saat permintaan datang melalui HTTPS di proxy tepercaya', async () => {
        const { app } = siapkan({ trustProxy: 'loopback' });
        const res = await panggilTanpaPort(app, { metode: 'GET', url: '/api/kesehatan', alamatSoket: '127.0.0.1', headers: { 'x-forwarded-proto': 'https' } });
        expect(res.status).toBe(200);
        expect(res.headers['strict-transport-security']).toBe('max-age=31536000; includeSubDomains');
    });
});
