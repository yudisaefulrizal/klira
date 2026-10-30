import type { HalamanKamusTerminologiDto, KamusTerminologiMasukan, KodeTerminologiDto } from '@klira/shared';
import icd10 from './data/icd10-2010.json';
import icd9cm from './data/icd9cm-2010.json';
import indonesia from './data/icd10-padanan-id.json';

type SistemIcd = 'icd10' | 'icd9cm';
export const sistemIcd = (sistem: string): sistem is SistemIcd => sistem === 'icd10' || sistem === 'icd9cm';

// JSON ikut disalin oleh tsc ke dist; dimuat sekali, tanpa query DB atau unduhan saat digunakan.
const padanan: Readonly<Record<string, string>> = indonesia.sha256_berkas_primer === icd10.sha256_primer ? indonesia.padanan : {};
const buatDaftar = (sistem: SistemIcd, data: { kode: { kode: string; nama: string }[] }): KodeTerminologiDto[] =>
  data.kode.map((k) => ({ sistem, kode: k.kode, nama: k.nama, contoh: false, ...(sistem === 'icd10' && padanan[k.kode] ? { nama_indonesia: padanan[k.kode], status_padanan: 'komunitas' as const } : {}) }));
const referensi = { icd10: buatDaftar('icd10', icd10), icd9cm: buatDaftar('icd9cm', icd9cm) };

export function kamusIcd(q: KamusTerminologiMasukan & { sistem: SistemIcd }): HalamanKamusTerminologiDto {
  const awalan = q.awalan?.toUpperCase();
  const daftar = awalan ? referensi[q.sistem].filter((k) => k.kode.startsWith(awalan)) : referensi[q.sistem];
  const mulai = (q.halaman - 1) * q.ukuran;
  return { data: daftar.slice(mulai, mulai + q.ukuran), total: daftar.length, halaman: q.halaman, ukuran: q.ukuran };
}

/** Urutan saran tetap: awalan kode, awalan nama, lalu nama memuat kata. */
export function cariIcd(sistem: SistemIcd, kata: string, batas: number): KodeTerminologiDto[] {
  const q = kata.trim().toLowerCase();
  if (!q) return [];
  const kode: KodeTerminologiDto[] = [], namaAwal: KodeTerminologiDto[] = [], namaMemuat: KodeTerminologiDto[] = [];
  for (const k of referensi[sistem]) {
    const nama = k.nama.toLowerCase();
    const alias = k.nama_indonesia?.toLowerCase() ?? '';
    if (k.kode.toLowerCase().startsWith(q)) kode.push(k);
    else if (nama.startsWith(q) || alias.startsWith(q)) namaAwal.push(k);
    else if (nama.includes(q) || alias.includes(q)) namaMemuat.push(k);
  }
  return [...kode, ...namaAwal, ...namaMemuat].slice(0, batas);
}
