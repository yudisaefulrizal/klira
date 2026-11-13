import { panggilApi } from './klien.js';
export const cariWilayah = (kata) => panggilApi('GET', `/wilayah?cari=${encodeURIComponent(kata)}`);
const cache = new Map();
export function ingatWilayah(w) { cache.set(w.kode, w); }
export async function ambilWilayah(kode) {
    const ada = cache.get(kode);
    if (ada)
        return ada;
    const w = await panggilApi('GET', `/wilayah/${encodeURIComponent(kode)}`);
    ingatWilayah(w);
    return w;
}
