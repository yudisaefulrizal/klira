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
    };
}
