import { GalatIntegrasi } from '../galat.js';

const LAYANAN = 'satusehat';
const URL_NIK = 'https://fhir.kemkes.go.id/id/nik';
const BATAS_WAKTU_MS = 15000;
/** Token dianggap habis sedikit sebelum waktunya agar tidak terpakai saat sudah kedaluwarsa di server. */
const MARGIN_TOKEN_MS = 60000;

/** Pesan dari OperationOutcome: details.text, lalu diagnostics, lalu details.coding[0].display. */
export function pesanOperationOutcome(badan) {
    if (!badan || badan.resourceType !== 'OperationOutcome' || !Array.isArray(badan.issue))
        return [];
    return badan.issue
        .map((i) => i.details?.text ?? i.diagnostics ?? i.details?.coding?.[0]?.display)
        .filter(Boolean)
        .map(String);
}

const tanpaGarisAkhir = (url) => url.replace(/\/+$/, '');

/**
 * Klien SATUSEHAT (OAuth2 client_credentials + FHIR R4).
 * `fetchFn` dan `sekarang` dapat diganti untuk uji. Tidak ada keadaan selain token yang disimpan di memori.
 */
export function buatKlienSatusehat({ baseUrl, clientId, clientSecret, organizationId, fetchFn = globalThis.fetch, sekarang = Date.now, batasWaktuMs = BATAS_WAKTU_MS }) {
    if (!baseUrl || !clientId || !clientSecret || !organizationId)
        throw new GalatIntegrasi('Konfigurasi SATUSEHAT belum lengkap (base_url, client_id, client_secret, organization_id).', { layanan: LAYANAN });
    const dasar = tanpaGarisAkhir(baseUrl);
    const dasarUrl = dasar;
    const fhir = `${dasar}/fhir-r4/v1`;
    let tokenCache = null;

    async function kirim(url, init) {
        let respons;
        try {
            respons = await fetchFn(url, { ...init, redirect: 'error', signal: AbortSignal.timeout(batasWaktuMs) });
        }
        catch {
            throw new GalatIntegrasi('SATUSEHAT tidak dapat dihubungi. Coba lagi sebentar lagi.', { layanan: LAYANAN, jaringan: true });
        }
        const teks = await respons.text();
        let badan = null;
        try {
            badan = teks ? JSON.parse(teks) : null;
        }
        catch {
            badan = null;
        }
        return { status: respons.status, ok: respons.ok, badan };
    }

    async function token(paksa = false) {
        if (!paksa && tokenCache && tokenCache.habisPada > sekarang())
            return tokenCache.nilai;
        const { status, ok, badan } = await kirim(`${dasar}/oauth2/v1/accesstoken?grant_type=client_credentials`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret }),
        });
        if (!ok || !badan?.access_token) {
            const rincian = pesanOperationOutcome(badan);
            throw new GalatIntegrasi(rincian[0] ?? 'SATUSEHAT menolak kredensial.', { layanan: LAYANAN, status, rincian });
        }
        const detik = Number(badan.expires_in);
        tokenCache = { nilai: badan.access_token, habisPada: sekarang() + (Number.isFinite(detik) ? detik : 0) * 1000 - MARGIN_TOKEN_MS };
        return tokenCache.nilai;
    }

    /** Panggilan FHIR bertoken; satu kali coba ulang bila token ditolak (401). */
    async function minta(metode, jalur, badan) {
        const jalankan = async (paksaToken) => kirim(`${fhir}${jalur}`, {
            method: metode,
            headers: { Authorization: `Bearer ${await token(paksaToken)}`, ...(badan === undefined ? {} : { 'Content-Type': 'application/json' }) },
            body: badan === undefined ? undefined : JSON.stringify(badan),
        });
        let hasil = await jalankan(false);
        if (hasil.status === 401) {
            tokenCache = null;
            hasil = await jalankan(true);
        }
        if (!hasil.ok) {
            const rincian = pesanOperationOutcome(hasil.badan);
            throw new GalatIntegrasi(rincian[0] ?? `SATUSEHAT menolak permintaan (HTTP ${hasil.status}).`, { layanan: LAYANAN, status: hasil.status, rincian });
        }
        if (hasil.badan === null)
            throw new GalatIntegrasi('Respons SATUSEHAT tidak dapat dibaca.', { layanan: LAYANAN, status: hasil.status });
        return hasil.badan;
    }

    /**
     * Permintaan apa adanya untuk alat uji endpoint: tidak melempar untuk status non-2xx, mengembalikan badan respons mentah.
     * `dasar`: 'fhir' (/fhir-r4/v1) atau 'kfa' (/kfa-v2). Token diurus otomatis, termasuk coba ulang sekali bila 401.
     */
    async function kirimMentah({ metode, dasar: jenis = 'fhir', jalur, badan }) {
        const awal = jenis === 'kfa' ? `${dasarUrl}/kfa-v2` : fhir;
        const url = `${awal}${jalur}`;
        const jalankan = async (paksa) => kirim(url, {
            method: metode,
            headers: { Authorization: `Bearer ${await token(paksa)}`, ...(badan === undefined ? {} : { 'Content-Type': 'application/json' }) },
            body: badan === undefined ? undefined : JSON.stringify(badan),
        });
        let hasil = await jalankan(false);
        if (hasil.status === 401) {
            tokenCache = null;
            hasil = await jalankan(true);
        }
        return { status: hasil.status, url, badan: hasil.badan };
    }

    async function cariMenurutNik(tipe, nik) {
        const bundel = await minta('GET', `/${tipe}?identifier=${encodeURIComponent(`${URL_NIK}|${nik}`)}`);
        const sumber = bundel.entry?.[0]?.resource;
        return sumber ? { ditemukan: true, id: sumber.id, resource: sumber } : { ditemukan: false, id: null, resource: null };
    }

    return {
        token,
        kirimMentah,
        /** Uji kredensial: ambil token lalu baca Organization fasyankes. */
        async uji() {
            await token(true);
            const organisasi = await minta('GET', `/Organization/${encodeURIComponent(organizationId)}`);
            return { ok: true, organisasi: { id: organisasi.id, nama: organisasi.name ?? null } };
        },
        cariPasienNik: (nik) => cariMenurutNik('Patient', nik),
        cariNakesNik: (nik) => cariMenurutNik('Practitioner', nik),
        baca: (tipe, id) => minta('GET', `/${tipe}/${encodeURIComponent(id)}`),
        async buat(resource) {
            const badan = await minta('POST', `/${resource.resourceType}`, resource);
            // Patient dijawab dengan {success, data.patient_id}; resource lain dengan resource beserta id.
            const id = badan.data?.patient_id ?? badan.create_patient?.data?.patient_id ?? badan.id;
            if (!id)
                throw new GalatIntegrasi('SATUSEHAT tidak mengembalikan id resource.', { layanan: LAYANAN });
            return { id, resource: badan };
        },
        async ubah(resource) {
            return minta('PUT', `/${resource.resourceType}/${encodeURIComponent(resource.id)}`, resource);
        },
        /** Kirim Bundle transaksi. Hasil: daftar {tipe, id} sesuai urutan entri. */
        async kirimBundle(bundel) {
            const badan = await minta('POST', '', bundel);
            const entri = (badan.entry ?? []).map((e) => {
                const cocok = /^([A-Za-z]+)\/([^/]+)/.exec(e.response?.location ?? '');
                return cocok ? { tipe: cocok[1], id: cocok[2] } : null;
            });
            if (entri.length !== (bundel.entry ?? []).length || entri.includes(null))
                throw new GalatIntegrasi('Respons Bundle SATUSEHAT tidak lengkap.', { layanan: LAYANAN });
            return entri;
        },
        /** Detail produk KFA menurut kode; null bila tidak ada. */
        async kfa(kode) {
            const hasil = await kirim(`${dasar}/kfa-v2/products?identifier=kfa&code=${encodeURIComponent(kode)}`, { method: 'GET', headers: { Authorization: `Bearer ${await token()}` } });
            if (!hasil.ok)
                throw new GalatIntegrasi('KFA menolak permintaan.', { layanan: LAYANAN, status: hasil.status, rincian: pesanOperationOutcome(hasil.badan) });
            return hasil.badan?.result ?? null;
        },
    };
}
