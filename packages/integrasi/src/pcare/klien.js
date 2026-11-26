import { GalatIntegrasi } from '../galat.js';
import { buatAuthorization, buatSignature, dekripsiRespons } from './kripto.js';

const LAYANAN = 'pcare';
const BATAS_WAKTU_MS = 15000;
const tanpaGarisAkhir = (url) => url.replace(/\/+$/, '');

/**
 * Klien PCare BPJS. Header dan enkripsi mengikuti bridging-bpjs: X-cons-id, X-Timestamp, X-Signature, user_key, X-Authorization;
 * isi `response` terenkripsi didekripsi di sini. Setiap permintaan memakai timestamp baru.
 */
export function buatKlienPcare({ baseUrl, serviceName, consId, secretKey, userKey, username, password, appCode, fetchFn = globalThis.fetch, sekarang = Date.now, batasWaktuMs = BATAS_WAKTU_MS }) {
    if (![baseUrl, serviceName, consId, secretKey, userKey, username, password, appCode].every(Boolean))
        throw new GalatIntegrasi('Konfigurasi PCare belum lengkap.', { layanan: LAYANAN });
    const dasar = `${tanpaGarisAkhir(baseUrl)}/${serviceName.replace(/^\/+|\/+$/g, '')}`;

    /** Kirim permintaan; tidak melempar untuk status HTTP non-2xx (PCare mengabarkan galat lewat metaData). */
    async function kirimMentah({ metode, jalur, badan }) {
        const timestamp = String(Math.floor(sekarang() / 1000));
        const tulis = metode === 'POST' || metode === 'PUT';
        const headers = {
            'X-cons-id': consId, 'X-Timestamp': timestamp, 'X-Signature': buatSignature(consId, timestamp, secretKey), user_key: userKey,
            'X-Authorization': buatAuthorization(username, password, appCode),
            'Content-Type': metode === 'GET' ? 'application/json; charset=utf-8' : tulis ? 'text/plain' : 'application/json',
            ...(metode === 'GET' ? {} : { Accept: 'application/json' }),
        };
        const url = `${dasar}${jalur}`;
        let respons;
        try {
            respons = await fetchFn(url, { method: metode, headers, body: tulis && badan !== undefined ? JSON.stringify(badan) : undefined, redirect: 'error', signal: AbortSignal.timeout(batasWaktuMs) });
        }
        catch {
            throw new GalatIntegrasi('PCare tidak dapat dihubungi. Coba lagi sebentar lagi.', { layanan: LAYANAN, jaringan: true });
        }
        const teks = await respons.text();
        let json = null;
        try {
            json = teks ? JSON.parse(teks) : null;
        }
        catch {
            json = null;
        }
        if (!json || typeof json !== 'object')
            return { status: respons.status, url, metaData: null, response: null, terbaca: false };
        let isi = json.response ?? null;
        let gagalDekripsi = false;
        if (typeof isi === 'string') {
            try {
                isi = dekripsiRespons(isi, consId, secretKey, timestamp);
            }
            catch {
                gagalDekripsi = true;
            }
        }
        // Layanan antrean BPJS menulis `metadata` (huruf kecil); PCare menulis `metaData`.
        return { status: respons.status, url, metaData: json.metaData ?? json.metadata ?? null, response: isi, terbaca: true, gagalDekripsi };
    }

    /** Ekstrak pesan galat ringkas dari respons PCare (termasuk rincian validasi 412). */
    function pesanGalatPcare(h) {
        if (!h.terbaca)
            return `PCare mengembalikan respons tidak terbaca (HTTP ${h.status}).`;
        if (h.gagalDekripsi)
            return 'Gagal mendekripsi respons PCare.';
        if (Array.isArray(h.response) && h.response.length)
            return h.response.map((r) => (r?.field ? `${r.field}: ${r.message}` : r?.message)).filter(Boolean).join('; ');
        return h.metaData?.message ?? `PCare menolak permintaan (HTTP ${h.status}).`;
    }

    /** Kirim GET dan kembalikan `{ ok, kode, data, pesan }`. */
    async function ambil(jalur) {
        const h = await kirimMentah({ metode: 'GET', jalur });
        const kode = Number(h.metaData?.code ?? h.status);
        if (!h.terbaca || h.gagalDekripsi)
            return { ok: false, kode: h.status, data: null, pesan: pesanGalatPcare(h) };
        if (kode === 204)
            return { ok: true, kode: 204, data: null, pesan: null };
        if (kode >= 200 && kode < 300)
            return { ok: true, kode, data: h.response, pesan: null };
        return { ok: false, kode, data: h.response, pesan: pesanGalatPcare(h) };
    }

    /** Kirim POST/PUT dan kembalikan `{ ok, kode, data, pesan }`. */
    async function kirimData(metode, jalur, badan) {
        const h = await kirimMentah({ metode, jalur, badan });
        const kode = Number(h.metaData?.code ?? h.status);
        if (!h.terbaca || h.gagalDekripsi)
            return { ok: false, kode: h.status, data: null, pesan: pesanGalatPcare(h) };
        if (kode >= 200 && kode < 300)
            return { ok: true, kode, data: h.response, pesan: null };
        return { ok: false, kode, data: h.response, pesan: pesanGalatPcare(h) };
    }

    const ambilNilaiField = (data, field) => (Array.isArray(data) ? data.find((x) => x?.field === field)?.message : data?.[field]) ?? null;

    return {
        kirimMentah,
        /** Uji kredensial: baca referensi kesadaran. Berhasil bila metaData.code 200 atau 204. */
        async uji() {
            const h = await kirimMentah({ metode: 'GET', jalur: '/kesadaran' });
            const kode = h.metaData?.code;
            if (!h.terbaca || (kode !== 200 && kode !== 204))
                throw new GalatIntegrasi(h.metaData?.message ?? `PCare menolak permintaan (HTTP ${h.status}).`, { layanan: LAYANAN, status: h.status });
            return { ok: true };
        },
        /** Cek data peserta BPJS berdasarkan nomor kartu (`noka`) atau NIK (`nik`). */
        cekPeserta(nomor, jenis = 'noka') {
            const bersih = encodeURIComponent(String(nomor ?? '').trim());
            const jalur = jenis === 'nik' ? `/peserta/nik/${bersih}` : `/peserta/${bersih}`;
            return ambil(jalur);
        },
        referensiPoli: (start = 0, limit = 100) => ambil(`/poli/fktp/${start}/${limit}`),
        referensiDokter: (start = 0, limit = 100) => ambil(`/dokter/${start}/${limit}`),
        referensiTindakan: (kdTkp = '10', start = 0, limit = 100) => ambil(`/tindakan/kdTkp/${encodeURIComponent(kdTkp)}/${start}/${limit}`),
        referensiDiagnosa: (keyword, start = 0, limit = 20) => ambil(`/diagnosa/${encodeURIComponent(keyword)}/${start}/${limit}`),
        referensiObat: (keyword, start = 0, limit = 20) => ambil(`/obat/dpho/${encodeURIComponent(keyword)}/${start}/${limit}`),
        referensiStatusPulang: (rawatInap = false) => ambil(`/statuspulang/rawatInap/${Boolean(rawatInap)}`),
        referensiKesadaran: () => ambil('/kesadaran'),
        referensiFaskesRujuk: ({ kdSubSpesialis, kdSarana = '1', tglEstRujuk }) =>
            ambil(`/spesialis/rujuk/subspesialis/${encodeURIComponent(kdSubSpesialis)}/sarana/${encodeURIComponent(kdSarana)}/tglEstRujuk/${encodeURIComponent(tglEstRujuk)}`),
        async kirimPendaftaran(badan) {
            const h = await kirimData('POST', '/pendaftaran', badan);
            return { ...h, noUrut: h.ok ? (h.data?.message ?? ambilNilaiField(h.data, 'noUrut')) : null };
        },
        async kirimKunjungan(badan) {
            const h = await kirimData('POST', '/kunjungan/v1', badan);
            return { ...h, noKunjungan: h.ok ? ambilNilaiField(h.data, 'noKunjungan') : null };
        },
        async ubahKunjungan(badan) {
            const h = await kirimData('PUT', '/kunjungan/v1', badan);
            return { ...h, noKunjungan: h.ok ? (ambilNilaiField(h.data, 'noKunjungan') ?? badan.noKunjungan ?? null) : null };
        },
        async kirimTindakan(badan) {
            const h = await kirimData('POST', '/tindakan/kunjungan', badan);
            return { ...h, kdTindakanSK: h.ok ? ambilNilaiField(h.data, 'kdTindakanSK') : null };
        },
        async kirimObat(badan) {
            const h = await kirimData('POST', '/obat/kunjungan', badan);
            return { ...h, kdObatSK: h.ok ? ambilNilaiField(h.data, 'kdObatSK') : null };
        },
    };
}
