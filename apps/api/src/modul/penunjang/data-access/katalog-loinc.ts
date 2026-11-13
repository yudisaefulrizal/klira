import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { LoincDto } from '@klira/shared';

type Entri = { dto: LoincDto; nama: string; kode: string; urut: number };

const normal = (s: string) => s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('id').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

let katalog: Entri[] | undefined;
/** Kode LOINC laboratorium aktif dari apps/api/data/loinc.json; dimuat sekali. Bukan tabel database. */
function muat(): Entri[] {
  return (katalog ??= (JSON.parse(readFileSync(path.resolve(__dirname, '../../../../data/loinc.json'), 'utf8')) as { kode: [string, string, string, number][] }).kode.map(([kode, nama, kelas, urut]) => ({
    dto: { kode, nama, kelas },
    nama: normal(nama),
    kode: kode.toLowerCase(),
    urut,
  })));
}

const SEPERTI_KODE = /^\d[\d-]*$/;

/**
 * Kueri berbentuk kode (angka dan tanda hubung) dicocokkan sebagai awalan kode. Selain itu per kata: semua kata harus ada di nama atau kode.
 * Urut: kode persis, pemeriksaan kuantitatif umum (`urut` 0) sebelum yang lain, nama diawali kueri, lalu nama lebih pendek.
 */
export function cariKatalogLoinc(cari: string, batas: number): LoincDto[] {
  const kueri = normal(cari);
  if (kueri.length < 2) return [];
  const kata = kueri.split(' ');
  const mentah = cari.trim().toLowerCase();
  const cocok = SEPERTI_KODE.test(mentah) ? muat().filter((e) => e.kode.startsWith(mentah)) : muat().filter((e) => kata.every((k) => e.nama.includes(k) || e.kode.includes(k)));
  const persis = (e: Entri) => (e.kode === mentah ? 0 : 1);
  const diawali = (e: Entri) => (e.nama.startsWith(kueri) ? 0 : 1);
  cocok.sort((a, b) => persis(a) - persis(b) || a.urut - b.urut || diawali(a) - diawali(b) || a.dto.nama.length - b.dto.nama.length || a.dto.nama.localeCompare(b.dto.nama, 'id'));
  return cocok.slice(0, batas).map((e) => e.dto);
}
