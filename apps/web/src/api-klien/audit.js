import { GALAT } from '@klira/shared';
import { GalatApi, panggilApi } from './klien.js';
const qs = (f) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(f))
        if (v !== undefined && v !== '')
            p.set(k, String(v));
    const s = p.toString();
    return s ? `?${s}` : '';
};
export const daftarAudit = (f = {}) => panggilApi('GET', `/audit${qs(f)}`);
export const detailAudit = (id) => panggilApi('GET', `/audit/${id}`);
/** Ekspor CSV; mengembalikan isi CSV (peladen mencatatnya sebagai aksi ekspor). */
export async function eksporAudit(f = {}, ambil = fetch) {
    let res;
    try {
        res = await ambil('/api/audit/ekspor', {
            method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify(f),
        });
    }
    catch {
        throw new GalatApi(0, GALAT.jaringan);
    }
    if (!res.ok) {
        const isi = (await res.json().catch(() => null));
        throw new GalatApi(res.status, isi?.galat?.pesan ?? GALAT.umum, undefined, isi?.galat?.kode);
    }
    return res.text();
}
