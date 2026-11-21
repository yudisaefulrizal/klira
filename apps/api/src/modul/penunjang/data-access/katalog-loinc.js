import { fileURLToPath as kliraFilePath } from 'node:url';
const __dirname = kliraFilePath(new URL('.', import.meta.url));
import { readFileSync } from 'node:fs';
import path from 'node:path';
const normal = (s) => s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('id').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const kolator = new Intl.Collator('id');
let katalog;
/** Kode LOINC laboratorium aktif dari apps/api/data/loinc.json; dimuat sekali. Bukan tabel database. */
function muat() {
    if (!katalog) {
        katalog = JSON.parse(readFileSync(path.resolve(__dirname, '../../../../data/loinc.json'), 'utf8')).kode.map(([kode, nama, kelas, urut]) => ({
            dto: { kode, nama, kelas },
            nama: normal(nama),
            kode: kode.toLowerCase(),
            urut,
        }));
        katalog.sort((a, b) => a.urut - b.urut || a.dto.nama.length - b.dto.nama.length || kolator.compare(a.dto.nama, b.dto.nama));
    }
    return katalog;
}
const SEPERTI_KODE = /^\d[\d-]*$/;
/**
 * Kueri berbentuk kode (angka dan tanda hubung) dicocokkan sebagai awalan kode. Selain itu per kata: semua kata harus ada di nama atau kode.
 * Urut: kode persis, pemeriksaan kuantitatif umum (`urut` 0) sebelum yang lain, nama diawali kueri, lalu nama lebih pendek.
 */
export function cariKatalogLoinc(cari, batas) {
    const kueri = normal(cari);
    if (kueri.length < 2 || batas <= 0)
        return [];
    const kata = kueri.split(' ');
    const mentah = cari.trim().toLowerCase();
    const sepertiKode = SEPERTI_KODE.test(mentah);
    const persis = [];
    const lainnya = [];
    for (const e of muat()) {
        const cocok = sepertiKode ? e.kode.startsWith(mentah) : kata.every((k) => e.nama.includes(k) || e.kode.includes(k));
        if (!cocok)
            continue;
        if (e.kode === mentah)
            persis.push(e);
        else
            lainnya.push(e);
    }
    if (persis.length >= batas)
        return persis.slice(0, batas).map((e) => e.dto);
    const sisa = batas - persis.length;
    if (lainnya.length > 1) {
        const diawali = (e) => (e.nama.startsWith(kueri) ? 0 : 1);
        lainnya.sort((a, b) => a.urut - b.urut || diawali(a) - diawali(b) || a.dto.nama.length - b.dto.nama.length || kolator.compare(a.dto.nama, b.dto.nama));
    }
    return [...persis, ...lainnya.slice(0, sisa)].map((e) => e.dto);
}
