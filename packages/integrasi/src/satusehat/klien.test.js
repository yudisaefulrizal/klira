import { buatAplikasiSatusehat, KONFIG_SATUSEHAT_BAWAAN } from '../../../../dummy-intergrasi/satusehat/satusehat.js';
import { mulaiDummy, tutupDummy, PORT_SATUSEHAT, URL_SATUSEHAT } from '../../../../dummy-intergrasi/uji-bantu.js';
import { buatKlienSatusehat, GalatIntegrasi, pesanOperationOutcome } from '../index.js';

const K = KONFIG_SATUSEHAT_BAWAAN;
const LOKASI = 'b017aa54-f1df-4ec2-9d84-8823815d7228';
const baseUrl = URL_SATUSEHAT;
let server;

beforeAll(async () => {
    server = await mulaiDummy(buatAplikasiSatusehat(), PORT_SATUSEHAT);
});
afterAll(() => tutupDummy(server));

const klien = (ubah = {}) => buatKlienSatusehat({ baseUrl, clientId: K.clientId, clientSecret: K.clientSecret, organizationId: K.organizationId, ...ubah });

describe('konfigurasi', () => {
    it('menolak konfigurasi tidak lengkap', () => {
        expect(() => buatKlienSatusehat({ baseUrl })).toThrow(GalatIntegrasi);
    });
    it('menerima garis miring di akhir base_url', async () => {
        const hasil = await klien({ baseUrl: `${baseUrl}/` }).uji();
        expect(hasil.ok).toBe(true);
    });
});

describe('token dan uji koneksi', () => {
    it('uji membaca Organization fasyankes', async () => {
        expect(await klien().uji()).toEqual({ ok: true, organisasi: { id: K.organizationId, nama: 'Klinik Pratama Contoh' } });
    });

    it('kredensial salah memberi GalatIntegrasi dengan pesan layanan', async () => {
        const galat = await klien({ clientSecret: 'salah' }).uji().catch((e) => e);
        expect(galat).toBeInstanceOf(GalatIntegrasi);
        expect(galat.status).toBe(401);
        expect(galat.message).toMatch(/Invalid client/);
        expect(galat.layanan).toBe('satusehat');
    });

    it('Organization yang tidak ada memberi galat 404', async () => {
        const galat = await klien({ organizationId: 'tidak-ada' }).uji().catch((e) => e);
        expect(galat.status).toBe(404);
    });

    it('token dipakai ulang antarpanggilan', async () => {
        let permintaanToken = 0;
        const fetchFn = (url, init) => {
            if (String(url).includes('/oauth2/')) permintaanToken += 1;
            return fetch(url, init);
        };
        const k = klien({ fetchFn });
        await k.cariPasienNik('9999000000000001');
        await k.cariPasienNik('9999000000000002');
        expect(permintaanToken).toBe(1);
    });

    it('token yang sudah habis diminta ulang', async () => {
        let permintaanToken = 0;
        const fetchFn = (url, init) => {
            if (String(url).includes('/oauth2/')) permintaanToken += 1;
            return fetch(url, init);
        };
        let waktu = 1_000_000;
        const k = klien({ fetchFn, sekarang: () => waktu });
        await k.cariPasienNik('9999000000000001');
        waktu += 3600 * 1000;
        await k.cariPasienNik('9999000000000001');
        expect(permintaanToken).toBe(2);
    });

    it('token ditolak (401) memicu satu kali coba ulang dengan token baru', async () => {
        let fhirDipanggil = 0;
        let permintaanToken = 0;
        const fetchFn = (url, init) => {
            if (String(url).includes('/oauth2/')) permintaanToken += 1;
            else {
                fhirDipanggil += 1;
                if (fhirDipanggil === 1) return fetch(url, { ...init, headers: { ...init.headers, Authorization: 'Bearer basi' } });
            }
            return fetch(url, init);
        };
        const hasil = await klien({ fetchFn }).cariPasienNik('9999000000000001');
        expect(hasil.ditemukan).toBe(true);
        expect(fhirDipanggil).toBe(2);
        expect(permintaanToken).toBe(2);
    });
});

describe('pencarian', () => {
    it('pasien dicari menurut NIK', async () => {
        const hasil = await klien().cariPasienNik('9999000000000001');
        expect(hasil).toMatchObject({ ditemukan: true, id: 'P02478375538' });
        expect(hasil.resource.resourceType).toBe('Patient');
    });
    it('NIK yang tidak ada memberi ditemukan=false', async () => {
        expect(await klien().cariPasienNik('1111111111111111')).toEqual({ ditemukan: false, id: null, resource: null });
    });
    it('nakes dicari menurut NIK', async () => {
        expect(await klien().cariNakesNik('8888000000000001')).toMatchObject({ ditemukan: true, id: '10009880728' });
    });
    it('KFA: kode ada dan tidak ada', async () => {
        const k = klien();
        expect((await k.kfa('93000108')).kfa_code).toBe('93000108');
        expect(await k.kfa('00000000')).toBeNull();
    });
});

describe('menulis resource', () => {
    const pasien = (nik) => ({
        resourceType: 'Patient',
        identifier: [{ use: 'official', system: 'https://fhir.kemkes.go.id/id/nik', value: nik }],
        name: [{ use: 'official', text: 'Pasien Uji' }],
        telecom: [{ system: 'phone', value: '0812', use: 'mobile' }],
        address: [{ use: 'home', line: ['Jl. X'], country: 'ID' }],
        multipleBirthInteger: 0,
    });

    it('buat Patient mengembalikan id dari data.patient_id, lalu dapat dibaca', async () => {
        const k = klien();
        const { id } = await k.buat(pasien('3273010101000009'));
        expect(id).toMatch(/^P\d{11}$/);
        expect((await k.baca('Patient', id)).name[0].text).toBe('Pasien Uji');
    });

    it('galat validasi membawa rincian pesan layanan', async () => {
        const galat = await klien().buat(pasien('123')).catch((e) => e);
        expect(galat.status).toBe(400);
        expect(galat.rincian.join(' ')).toMatch(/16 digit/);
    });

    it('ubah (PUT) menambah versi', async () => {
        const k = klien();
        const encounter = {
            resourceType: 'Encounter', status: 'arrived',
            class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'AMB', display: 'ambulatory' },
            subject: { reference: 'Patient/P02478375538' },
            participant: [{ individual: { reference: 'Practitioner/10009880728' } }],
            location: [{ location: { reference: `Location/${LOKASI}` } }],
            serviceProvider: { reference: `Organization/${K.organizationId}` },
        };
        const { id, resource } = await k.buat(encounter);
        expect(resource.meta.versionId).toBe('1');
        const baru = await k.ubah({ ...resource, id, status: 'finished' });
        expect(baru.status).toBe('finished');
        expect(baru.meta.versionId).toBe('2');
    });

    it('kirimBundle mengembalikan {tipe,id} per entri dan referensi urn:uuid tersambung', async () => {
        const k = klien();
        const e = 'e0c4a4a2-3b6c-4d9a-8f3b-aaaaaaaaaaaa';
        const bundel = {
            resourceType: 'Bundle', type: 'transaction',
            entry: [
                {
                    fullUrl: `urn:uuid:${e}`, request: { method: 'POST', url: 'Encounter' },
                    resource: {
                        resourceType: 'Encounter', status: 'finished',
                        class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'AMB' },
                        subject: { reference: 'Patient/P02478375538' },
                        participant: [{ individual: { reference: 'Practitioner/10009880728' } }],
                        location: [{ location: { reference: `Location/${LOKASI}` } }],
                    },
                },
                {
                    fullUrl: 'urn:uuid:c0c4a4a2-3b6c-4d9a-8f3b-bbbbbbbbbbbb', request: { method: 'POST', url: 'Condition' },
                    resource: {
                        resourceType: 'Condition',
                        code: { coding: [{ system: 'http://hl7.org/fhir/sid/icd-10', code: 'A01.0' }] },
                        subject: { reference: 'Patient/P02478375538' },
                        encounter: { reference: `urn:uuid:${e}` },
                    },
                },
            ],
        };
        const hasil = await k.kirimBundle(bundel);
        expect(hasil.map((h) => h.tipe)).toEqual(['Encounter', 'Condition']);
        const condition = await k.baca('Condition', hasil[1].id);
        expect(condition.encounter.reference).toBe(`Encounter/${hasil[0].id}`);
    });

    it('Bundle rusak ditolak seluruhnya dengan pesan per entri', async () => {
        const galat = await klien().kirimBundle({
            resourceType: 'Bundle', type: 'transaction',
            entry: [{ fullUrl: 'urn:uuid:x', request: { method: 'POST', url: 'Condition' }, resource: { resourceType: 'Condition' } }],
        }).catch((e) => e);
        expect(galat.status).toBe(400);
        expect(galat.rincian[0]).toMatch(/^entry\[0\]/);
    });
});

describe('kirimMentah (alat uji endpoint)', () => {
    it('FHIR: mengembalikan status dan badan apa adanya, termasuk galat 404', async () => {
        const k = klien();
        const ok = await k.kirimMentah({ metode: 'GET', jalur: '/Patient/P02478375538' });
        expect(ok).toMatchObject({ status: 200, url: `${baseUrl}/fhir-r4/v1/Patient/P02478375538` });
        expect(ok.badan.resourceType).toBe('Patient');
        const tidakAda = await k.kirimMentah({ metode: 'GET', jalur: '/Patient/tidak-ada' });
        expect(tidakAda.status).toBe(404);
        expect(tidakAda.badan.resourceType).toBe('OperationOutcome');
    });
    it('KFA memakai jalur /kfa-v2', async () => {
        const h = await klien().kirimMentah({ metode: 'GET', dasar: 'kfa', jalur: '/products?identifier=kfa&code=93000108' });
        expect(h.url).toBe(`${baseUrl}/kfa-v2/products?identifier=kfa&code=93000108`);
        expect(h.badan.result.kfa_code).toBe('93000108');
    });
    it('POST dengan badan; galat validasi 400 tidak melempar', async () => {
        const h = await klien().kirimMentah({ metode: 'POST', jalur: '/Condition', badan: { resourceType: 'Condition' } });
        expect(h.status).toBe(400);
        expect(h.badan.issue.length).toBeGreaterThan(0);
    });
});

describe('galat jaringan', () => {
    it('jaringan putus ditandai jaringan=true tanpa membocorkan rincian', async () => {
        const fetchFn = async () => { throw new TypeError('fetch failed: ECONNREFUSED 10.0.0.5:443'); };
        const galat = await klien({ fetchFn }).uji().catch((e) => e);
        expect(galat).toBeInstanceOf(GalatIntegrasi);
        expect(galat.jaringan).toBe(true);
        expect(galat.message).toMatch(/tidak dapat dihubungi/);
        expect(galat.message).not.toContain('10.0.0.5');
    });

    it('respons yang bukan JSON dianggap galat', async () => {
        const fetchFn = async () => new Response('<html>gateway</html>', { status: 200 });
        const galat = await klien({ fetchFn }).uji().catch((e) => e);
        expect(galat).toBeInstanceOf(GalatIntegrasi);
    });
});

describe('pesanOperationOutcome', () => {
    it('mengambil details.text, diagnostics, atau display', () => {
        expect(pesanOperationOutcome({ resourceType: 'OperationOutcome', issue: [{ details: { text: 'a' } }, { diagnostics: 'b' }, { details: { coding: [{ display: 'c' }] } }, {}] })).toEqual(['a', 'b', 'c']);
        expect(pesanOperationOutcome({ resourceType: 'Patient' })).toEqual([]);
        expect(pesanOperationOutcome(null)).toEqual([]);
    });
});
