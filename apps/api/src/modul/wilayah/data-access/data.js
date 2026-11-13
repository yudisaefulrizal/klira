import { fileURLToPath as kliraFilePath } from 'node:url';
const __dirname = kliraFilePath(new URL('.', import.meta.url));
import { readFileSync } from 'node:fs';
import path from 'node:path';
let referensi;
export function dataWilayah() {
    return referensi ??= JSON.parse(readFileSync(path.resolve(__dirname, '../../../../data/wilayah.json'), 'utf8'));
}
export function ambilWilayah(kode) {
    const data = dataWilayah();
    if (!Object.hasOwn(data, kode))
        return null;
    const bagian = kode.split('.');
    const label = Array.from({ length: bagian.length }, (_, i) => data[bagian.slice(0, bagian.length - i).join('.')]).join(', ');
    return { kode, nama: data[kode], label };
}
const normal = (s) => s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('id').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
let desa;
export function cariWilayah(cari) {
    const kata = normal(cari).split(/\s+/).filter(Boolean);
    if (normal(cari).length < 2)
        return { data: [], lebih_banyak: false };
    desa ??= Object.keys(dataWilayah()).filter((k) => k.split('.').length === 4).map((k) => {
        const dto = ambilWilayah(k);
        return { dto, nama: normal(dto.nama), pencarian: normal(dto.label) };
    });
    const cocok = desa.filter((d) => kata.every((k) => d.pencarian.includes(k)));
    const kueri = normal(cari);
    const peringkat = (nama) => nama === kueri ? 0 : nama.startsWith(kueri) ? 1 : 2;
    cocok.sort((a, b) => peringkat(a.nama) - peringkat(b.nama) || a.dto.label.localeCompare(b.dto.label, 'id'));
    return { data: cocok.slice(0, 20).map((d) => d.dto), lebih_banyak: cocok.length > 20 };
}
