import { buatAplikasiPcare, KONFIG_PCARE_BAWAAN } from '../../../../dummy-intergrasi/p-care/pcare.js';
import { mulaiDummy, tutupDummy, PORT_PCARE, URL_PCARE } from '../../../../dummy-intergrasi/uji-bantu.js';
import { buatKlienPcare, GalatIntegrasi } from '../index.js';
import { buatAuthorization, buatSignature, dekripsiRespons } from './kripto.js';

const K = KONFIG_PCARE_BAWAAN;
let server;
beforeAll(async () => { server = await mulaiDummy(buatAplikasiPcare(), PORT_PCARE); });
afterAll(() => tutupDummy(server));

const dasar = { baseUrl: URL_PCARE, serviceName: K.serviceName, consId: K.consId, secretKey: K.secretKey, userKey: K.userKey, username: K.username, password: K.password, appCode: K.appCode };
const klien = (ubah = {}) => buatKlienPcare({ ...dasar, ...ubah });

describe('konfigurasi', () => {
    it('menolak konfigurasi tidak lengkap', () => {
        expect(() => buatKlienPcare({ ...dasar, userKey: '' })).toThrow(GalatIntegrasi);
    });
    it('serviceName dan baseUrl dengan garis miring berlebih tetap benar', async () => {
        const h = await klien({ baseUrl: `${URL_PCARE}/`, serviceName: `/${K.serviceName}/` }).kirimMentah({ metode: 'GET', jalur: '/kesadaran' });
        expect(h.status).toBe(200);
    });
});

describe('kirimMentah', () => {
    it('GET: respons terenkripsi didekripsi menjadi objek', async () => {
        const h = await klien().kirimMentah({ metode: 'GET', jalur: '/peserta/0000039043765' });
        expect(h).toMatchObject({ status: 200, terbaca: true, gagalDekripsi: false, metaData: { code: 200, message: 'OK' } });
        expect(h.response.nama).toBe('BUDI CONTOH');
        expect(h.url).toBe(`${URL_PCARE}/${K.serviceName}/peserta/0000039043765`);
    });

    it('204: response null tanpa dekripsi', async () => {
        const h = await klien().kirimMentah({ metode: 'GET', jalur: '/peserta/9999999999999' });
        expect(h).toMatchObject({ terbaca: true, metaData: { code: 204 }, response: null });
    });

    it('POST (teks biasa) dan galat validasi 412 tidak melempar dan membawa rincian terdekripsi', async () => {
        const h = await klien().kirimMentah({ metode: 'POST', jalur: '/pendaftaran', badan: { noKartu: '0000039043767', tglDaftar: '14-11-2026', kdPoli: '001', keluhan: 'x', kunjSakit: true, sistole: 1, diastole: 1, beratBadan: 1, tinggiBadan: 1, respRate: 1, heartRate: 1 } });
        expect(h.status).toBe(412);
        expect(h.metaData.code).toBe(412);
        expect(h.response[0]).toMatchObject({ field: 'noKartu' });
    });

    it('kredensial salah: 401 dengan metaData, bukan lemparan', async () => {
        const h = await klien({ secretKey: 'salah' }).kirimMentah({ metode: 'GET', jalur: '/kesadaran' });
        expect(h).toMatchObject({ status: 401, terbaca: true, metaData: { code: 401 } });
    });

    it('timestamp baru setiap permintaan', async () => {
        const stempel = [];
        const fetchFn = (url, init) => { stempel.push(init.headers['X-Timestamp']); return fetch(url, init); };
        let waktu = 1_700_000_000_000;
        const k = klien({ fetchFn, sekarang: () => waktu });
        await k.kirimMentah({ metode: 'GET', jalur: '/kesadaran' }).catch(() => {});
        waktu += 5000;
        await k.kirimMentah({ metode: 'GET', jalur: '/kesadaran' }).catch(() => {});
        expect(stempel).toEqual(['1700000000', '1700000005']);
    });

    it('badan bukan JSON ditandai tidak terbaca', async () => {
        const fetchFn = async () => new Response('<html>gateway</html>', { status: 502 });
        const h = await klien({ fetchFn }).kirimMentah({ metode: 'GET', jalur: '/kesadaran' });
        expect(h).toMatchObject({ status: 502, terbaca: false, metaData: null });
    });

    it('isi tidak dapat didekripsi ditandai gagalDekripsi dengan isi mentah', async () => {
        const fetchFn = async () => new Response(JSON.stringify({ metaData: { code: 200, message: 'OK' }, response: 'bukan-base64-terenkripsi' }), { status: 200 });
        const h = await klien({ fetchFn }).kirimMentah({ metode: 'GET', jalur: '/kesadaran' });
        expect(h).toMatchObject({ gagalDekripsi: true, response: 'bukan-base64-terenkripsi' });
    });

    it('jaringan putus: GalatIntegrasi jaringan tanpa rincian internal', async () => {
        const fetchFn = async () => { throw new TypeError('fetch failed ECONNREFUSED 10.0.0.5'); };
        const galat = await klien({ fetchFn }).kirimMentah({ metode: 'GET', jalur: '/kesadaran' }).catch((e) => e);
        expect(galat).toBeInstanceOf(GalatIntegrasi);
        expect(galat.jaringan).toBe(true);
        expect(galat.message).not.toContain('10.0.0.5');
    });
});

describe('uji', () => {
    it('berhasil dengan kredensial benar', async () => {
        expect(await klien().uji()).toEqual({ ok: true });
    });
    it('gagal dengan pesan layanan bila kredensial salah', async () => {
        const galat = await klien({ userKey: 'salah' }).uji().catch((e) => e);
        expect(galat).toBeInstanceOf(GalatIntegrasi);
        expect(galat.status).toBe(401);
        expect(galat.message).toMatch(/user_key/);
    });
});

describe('kripto', () => {
    it('signature dan authorization berbentuk sesuai', () => {
        expect(buatSignature('2112121', '1700000000', '1a2b1a2b1a2b')).toMatch(/^[A-Za-z0-9+/]{43}=$/);
        expect(buatAuthorization('u', 'p', '012')).toBe(`Basic ${Buffer.from('u:p:012').toString('base64')}`);
    });
    it('dekripsi menolak timestamp yang salah', async () => {
        const t = String(Math.floor(Date.now() / 1000));
        const res = await fetch(`${URL_PCARE}/${K.serviceName}/kesadaran`, { headers: { 'X-cons-id': K.consId, 'X-Timestamp': t, 'X-Signature': buatSignature(K.consId, t, K.secretKey), user_key: K.userKey, 'X-Authorization': buatAuthorization(K.username, K.password, K.appCode) } });
        const { response } = await res.json();
        expect(dekripsiRespons(response, K.consId, K.secretKey, t).list[0].kdSadar).toBe('01');
        expect(() => dekripsiRespons(response, K.consId, K.secretKey, String(Number(t) + 1))).toThrow();
    });
});
