import { GALAT } from '@klira/shared';
// ---- Tinjau perbaikan ----
/** Isi catatan menjadi baris teks "kunci: nilai" agar mudah dibandingkan peninjau; larik diringkas per butir. */
export function ringkasIsi(isi) {
    if (isi === null || isi === undefined)
        return [];
    if (typeof isi !== 'object')
        return [String(isi)];
    const baris = [];
    for (const [kunci, nilai] of Object.entries(isi)) {
        if (Array.isArray(nilai)) {
            baris.push(`${kunci}:`);
            nilai.forEach((x, i) => baris.push(`  ${i + 1}. ${typeof x === 'object' && x ? Object.values(x).filter((v) => v !== null && v !== '').join(' · ') : String(x)}`));
        }
        else if (nilai !== null && nilai !== '') {
            baris.push(`${kunci}: ${typeof nilai === 'object' ? JSON.stringify(nilai) : String(nilai)}`);
        }
    }
    return baris;
}
/** Baris yang berubah antara isi sekarang dan usulan (untuk penanda di peninjauan). */
export function selisihBaris(sekarang, usulan) {
    const a = new Set(sekarang);
    const b = new Set(usulan);
    return { sekarang: sekarang.map((teks) => ({ teks, beda: !b.has(teks) })), usulan: usulan.map((teks) => ({ teks, beda: !a.has(teks) })) };
}
// ---- Perbaiki catatan ----
export const alasanPerbaikanSah = (alasan) => alasan.trim().length > 0;
export const galatAlasanPerbaikan = (alasan) => (alasanPerbaikanSah(alasan) ? null : GALAT.alasanWajib);
