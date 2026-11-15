import { KATALOG_ENDPOINT, butuhBadan, contohBadan } from '@klira/shared';
import { buatAplikasiPcare } from '../../../../../../dummy-intergrasi/p-care/pcare.js';
import { buatAplikasiSatusehat, KONFIG_SATUSEHAT_BAWAAN } from '../../../../../../dummy-intergrasi/satusehat/satusehat.js';
import { mulaiDummy, tutupDummy, PORT_PCARE, PORT_SATUSEHAT, URL_PCARE, URL_SATUSEHAT } from '../../../../../../dummy-intergrasi/uji-bantu.js';
import { KONFIG_PCARE_BAWAAN } from '../../../../../../dummy-intergrasi/p-care/pcare.js';

const { buatLayananUjiEndpoint } = await import("./layanan.js");
const { buatLayananSatusehat } = await import("../../satusehat/domain/layanan.js");
const { buatLayananPcare } = await import("../../pcare/domain/layanan.js");

const P = { fasyankes_id: 1, id: 9 };
const SS = KONFIG_SATUSEHAT_BAWAAN;
const PC = KONFIG_PCARE_BAWAAN;

/** Repositori memori generik (satu baris per lingkungan) yang meniru kolom kredensial. */
function repoMemori(organizationId) {
    const baris = new Map();
    let urut = 0;
    return {
        organizationId: async () => organizationId,
        daftar: async () => [...baris.values()],
        ambil: async (_f, e) => baris.get(e) ?? null,
        ambilAktif: async () => [...baris.values()].find((k) => k.aktif) ?? null,
        tambah: async (f, d) => { urut += 1; baris.set(d.environment, { id: urut, fasyankes_id: f, aktif: false, diuji_pada: null, hasil_uji: null, ...d }); },
        ubah: async () => {},
        aktifkan: async (_f, id) => { for (const k of baris.values()) k.aktif = k.id === id; },
        catatUji: async () => {},
    };
}
const audit = { catat: async () => {} };
const identitas = { enkripsi: (t) => `enc(${t})`, dekripsi: (t) => t.replace(/^enc\((.*)\)$/, '$1') };

let serverSs;
let serverPc;
let l;
beforeAll(async () => {
    serverSs = await mulaiDummy(buatAplikasiSatusehat(), PORT_SATUSEHAT);
    serverPc = await mulaiDummy(buatAplikasiPcare(), PORT_PCARE);
    const layananSatusehat = buatLayananSatusehat({ repo: repoMemori(SS.organizationId), audit, ...identitas });
    const layananPcare = buatLayananPcare({ repo: repoMemori(null), audit, ...identitas });
    await layananSatusehat.simpan(P, { environment: 'sandbox', client_id: SS.clientId, client_secret: SS.clientSecret, base_url: URL_SATUSEHAT }, '::1');
    await layananSatusehat.aktifkan(P, 'sandbox', '::1');
    await layananPcare.simpan(P, { environment: 'sandbox', cons_id: PC.consId, secret_key: PC.secretKey, user_key: PC.userKey, username: PC.username, password: PC.password, app_code: PC.appCode, service_name: PC.serviceName, base_url: URL_PCARE }, '::1');
    await layananPcare.aktifkan(P, 'sandbox', '::1');
    l = buatLayananUjiEndpoint({ layananSatusehat, layananPcare, audit });
});
afterAll(async () => { await tutupDummy(serverSs); await tutupDummy(serverPc); });

const konteks = { organization_id: SS.organizationId };
const nilaiAwal = (x) => Object.fromEntries(x.parameter.map((q) => [q.nama, q.contoh.replace('{{organization_id}}', SS.organizationId) || 'ISI']));
const pesanRoute = /Jalur tidak ditemukan|Metode tidak didukung/;

describe('katalog terhadap service-dummy (klien dan layanan nyata)', () => {
    it('koneksi sandbox aktif untuk kedua layanan', async () => {
        expect((await l.katalog(P, 'satusehat')).koneksi).toEqual({ aktif: 'sandbox', boleh_uji: true, pesan: null });
        expect((await l.katalog(P, 'pcare')).koneksi.boleh_uji).toBe(true);
    });

    it.each(KATALOG_ENDPOINT.map((x) => [x.id, x]))('%s: jalur dikenali dummy (bukan 404 route/405) dan tidak ada galat jaringan', async (_id, x) => {
        const h = await l.kirim(P, { layanan: x.layanan, endpoint_id: x.id, parameter: nilaiAwal(x), ...(butuhBadan(x) ? { badan: contohBadan(x, nilaiAwal(x), konteks) } : {}) }, '::1');
        expect(h.ok).toBe(true);
        expect(h.data.galat).toBeNull();
        const r = h.data.respons;
        expect(r.status).toBeGreaterThanOrEqual(200);
        expect(r.status).not.toBe(401);
        if (x.layanan === 'pcare') {
            expect(r.terbaca).toBe(true);
            expect(r.gagal_dekripsi).toBe(false);
            expect(r.meta_data.message).not.toMatch(pesanRoute);
        }
        else {
            expect(JSON.stringify(r.badan)).not.toMatch(pesanRoute);
        }
    });
});

describe('alur nyata lewat alat uji', () => {
    it('PCare: daftar lalu tambah kunjungan memakai contoh katalog; nomor kunjungan terbentuk', async () => {
        const kirim = (id, parameter = {}, badan) => l.kirim(P, { layanan: 'pcare', endpoint_id: id, parameter, ...(badan ? { badan: JSON.stringify(badan) } : {}) }, '::1');
        const contoh = (id) => KATALOG_ENDPOINT.find((x) => x.id === id).badan;
        const daftar = await kirim('pc-daftar-buat', {}, { ...contoh('pc-daftar-buat'), tglDaftar: '01-02-2027' });
        expect(daftar.data.respons).toMatchObject({ status: 201, meta_data: { code: 201 }, badan: { message: '001' } });
        const kunj = await kirim('pc-kunjungan-buat', {}, { ...contoh('pc-kunjungan-buat'), tglDaftar: '01-02-2027' });
        expect(kunj.data.respons).toMatchObject({ status: 201 });
        expect(kunj.data.respons.badan[0].message).toMatch(/^0114A0260102Y\d{6}$/);
    });

    it('SATUSEHAT: Bundle contoh dari katalog menyimpan Encounter dan Condition', async () => {
        const x = KATALOG_ENDPOINT.find((e) => e.id === 'ss-bundle-kirim');
        const h = await l.kirim(P, { layanan: 'satusehat', endpoint_id: x.id, parameter: {}, badan: contohBadan(x, {}, konteks) }, '::1');
        expect(h.data.respons.status).toBe(200);
        expect(h.data.respons.badan).toMatchObject({ resourceType: 'Bundle', type: 'transaction-response' });
        expect(h.data.respons.badan.entry).toHaveLength(2);
    });

    it('galat validasi layanan tampil apa adanya (SATUSEHAT 400 dan PCare 412), bukan kegagalan alat', async () => {
        const a = await l.kirim(P, { layanan: 'satusehat', endpoint_id: 'ss-condition-buat', parameter: {}, badan: '{"resourceType":"Condition"}' }, '::1');
        expect(a.data.respons.status).toBe(400);
        expect(a.data.respons.badan.resourceType).toBe('OperationOutcome');
        const b = await l.kirim(P, { layanan: 'pcare', endpoint_id: 'pc-daftar-buat', parameter: {}, badan: '{}' }, '::1');
        expect(b.data.respons).toMatchObject({ status: 412, meta_data: { code: 412 } });
    });
});
