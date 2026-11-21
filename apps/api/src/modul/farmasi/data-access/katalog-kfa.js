import { fileURLToPath as kliraFilePath } from 'node:url';
const __dirname = kliraFilePath(new URL('.', import.meta.url));
import { readFileSync } from 'node:fs';
import path from 'node:path';
const normal = (s) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('id').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const kolator = new Intl.Collator('id');
const keEntri = (dto) => ({ dto, nama: normal(dto.nama), kode: dto.kode.toLowerCase() });
let katalog;
let perKode;
/** Katalog KFA resmi (tingkat 93) dari apps/api/data/kfa.json; dimuat sekali. Bukan tabel database. */
function muat() {
    if (!katalog) {
        const isi = JSON.parse(readFileSync(path.resolve(__dirname, '../../../../data/kfa.json'), 'utf8'));
        katalog = isi.produk.map((p) => keEntri({ ...p, lokal: false }));
        katalog.sort((a, b) => kolator.compare(a.dto.nama, b.dto.nama));
        perKode = new Map(katalog.map((e) => [e.dto.kode, e]));
    }
    return katalog;
}
const dariLokal = (l) => keEntri({ kode: l.kode, nama: l.nama, bentuk_sediaan: l.bentuk_sediaan, satuan: l.satuan, status: l.status, lokal: true });
/** Cari per kata (semua kata harus ada di nama atau kode), urut: nama persis, diawali kueri, lalu abjad. Dibatasi `batas`. */
export function cariKatalogKfa(cari, batas, lokal = []) {
    const kueri = normal(cari);
    if (kueri.length < 2 || batas <= 0)
        return [];
    const kata = kueri.split(' ');
    const adaLokal = lokal.length > 0;
    const ditimpa = adaLokal ? new Set(lokal.map((l) => l.kode)) : null;
    const p0 = [], p1 = [], p2 = [];
    const tampung = (e) => {
        if (!kata.every((k) => e.nama.includes(k) || e.kode.includes(k)))
            return;
        if (e.nama === kueri)
            p0.push(e);
        else if (e.nama.startsWith(kueri))
            p1.push(e);
        else
            p2.push(e);
    };
    for (const e of muat()) {
        if (ditimpa?.has(e.dto.kode))
            continue;
        tampung(e);
    }
    if (adaLokal) {
        for (const l of lokal)
            tampung(dariLokal(l));
        const urutAbjad = (a, b) => kolator.compare(a.dto.nama, b.dto.nama);
        p0.sort(urutAbjad);
        if (p0.length < batas)
            p1.sort(urutAbjad);
        if (p0.length + p1.length < batas)
            p2.sort(urutAbjad);
    }
    return [...p0, ...p1, ...p2].slice(0, batas).map((e) => e.dto);
}
/** Satu produk menurut kode (tambahan klinik didahulukan), atau null bila tidak ada. */
export function ambilKatalogKfa(kode, lokal = []) {
    muat();
    const l = lokal.find((x) => x.kode === kode);
    return l ? dariLokal(l).dto : perKode?.get(kode)?.dto ?? null;
}
