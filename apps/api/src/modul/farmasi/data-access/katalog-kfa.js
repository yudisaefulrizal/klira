import { fileURLToPath as kliraFilePath } from 'node:url';
const __dirname = kliraFilePath(new URL('.', import.meta.url));
import { readFileSync } from 'node:fs';
import path from 'node:path';
const normal = (s) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('id').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const keEntri = (dto) => ({ dto, nama: normal(dto.nama), kode: dto.kode.toLowerCase() });
let katalog;
let perKode;
/** Katalog KFA resmi (tingkat 93) dari apps/api/data/kfa.json; dimuat sekali. Bukan tabel database. */
function muat() {
    if (!katalog) {
        const isi = JSON.parse(readFileSync(path.resolve(__dirname, '../../../../data/kfa.json'), 'utf8'));
        katalog = isi.produk.map((p) => keEntri({ ...p, lokal: false }));
        perKode = new Map(katalog.map((e) => [e.dto.kode, e]));
    }
    return katalog;
}
const dariLokal = (l) => keEntri({ kode: l.kode, nama: l.nama, bentuk_sediaan: l.bentuk_sediaan, satuan: l.satuan, status: l.status, lokal: true });
/** Cari per kata (semua kata harus ada di nama atau kode), urut: nama persis, diawali kueri, lalu abjad. Dibatasi `batas`. */
export function cariKatalogKfa(cari, batas, lokal = []) {
    const kueri = normal(cari);
    if (kueri.length < 2)
        return [];
    const kata = kueri.split(' ');
    const ditimpa = new Set(lokal.map((l) => l.kode));
    const kandidat = [...muat().filter((e) => !ditimpa.has(e.dto.kode)), ...lokal.map(dariLokal)];
    const cocok = kandidat.filter((e) => kata.every((k) => e.nama.includes(k) || e.kode.includes(k)));
    const peringkat = (nama) => (nama === kueri ? 0 : nama.startsWith(kueri) ? 1 : 2);
    cocok.sort((a, b) => peringkat(a.nama) - peringkat(b.nama) || a.dto.nama.localeCompare(b.dto.nama, 'id'));
    return cocok.slice(0, batas).map((e) => e.dto);
}
/** Satu produk menurut kode (tambahan klinik didahulukan), atau null bila tidak ada. */
export function ambilKatalogKfa(kode, lokal = []) {
    muat();
    const l = lokal.find((x) => x.kode === kode);
    return l ? dariLokal(l).dto : perKode?.get(kode)?.dto ?? null;
}
