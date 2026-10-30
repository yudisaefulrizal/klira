import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { HasilCariWilayah, WilayahDto } from '@klira/shared';

let referensi: Record<string, string> | undefined;
export function dataWilayah(): Record<string, string> {
  return referensi ??= JSON.parse(readFileSync(path.resolve(__dirname, '../../../data/wilayah.json'), 'utf8')) as Record<string, string>;
}
export function ambilWilayah(kode: string): WilayahDto | null {
  const data = dataWilayah();
  if (!Object.hasOwn(data, kode)) return null;
  const bagian = kode.split('.');
  const label = Array.from({ length: bagian.length }, (_, i) => data[bagian.slice(0, bagian.length - i).join('.')]).join(', ');
  return { kode, nama: data[kode], label };
}
const normal = (s: string) => s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('id').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
let desa: { dto: WilayahDto; nama: string; pencarian: string }[] | undefined;
export function cariWilayah(cari: string): HasilCariWilayah {
  const kata = normal(cari).split(/\s+/).filter(Boolean);
  if (normal(cari).length < 2) return { data: [], lebih_banyak: false };
  desa ??= Object.keys(dataWilayah()).filter((k) => k.split('.').length === 4).map((k) => {
    const dto = ambilWilayah(k)!;
    return { dto, nama: normal(dto.nama), pencarian: normal(dto.label) };
  });
  const cocok = desa.filter((d) => kata.every((k) => d.pencarian.includes(k)));
  const kueri = normal(cari);
  const peringkat = (nama: string) => nama === kueri ? 0 : nama.startsWith(kueri) ? 1 : 2;
  cocok.sort((a, b) => peringkat(a.nama) - peringkat(b.nama) || a.dto.label.localeCompare(b.dto.label, 'id'));
  return { data: cocok.slice(0, 20).map((d) => d.dto), lebih_banyak: cocok.length > 20 };
}
