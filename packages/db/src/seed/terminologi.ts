import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { SISTEM_TERMINOLOGI } from '@klira/shared';
import type { SistemTerminologi } from '@klira/shared';
import { pecahBaris } from './wilayah';

export type BarisTerminologi = { sistem: SistemTerminologi; kode: string; nama: string; aktif: boolean };

/**
 * Seed kecil CONTOH master terminologi (4.8), hanya agar pencarian dapat dicoba. BUKAN data resmi: kode lengkap dan versi
 * terbaru Standar Terminologi SATUSEHAT diimpor lewat CSV (`npm run seed:terminologi -w packages/db -- berkas.csv`).
 */
export const TERMINOLOGI_CONTOH: BarisTerminologi[] = [
  { sistem: 'icd10', kode: 'I10', nama: 'Hipertensi esensial (primer)', aktif: true },
  { sistem: 'icd10', kode: 'E11.9', nama: 'Diabetes melitus tipe 2 tanpa komplikasi', aktif: true },
  { sistem: 'icd10', kode: 'E78.0', nama: 'Hiperkolesterolemia murni', aktif: true },
  { sistem: 'icd10', kode: 'J06.9', nama: 'Infeksi saluran napas atas akut, tidak spesifik (ISPA)', aktif: true },
  { sistem: 'icd10', kode: 'K29.7', nama: 'Gastritis, tidak spesifik', aktif: true },
  { sistem: 'icd10', kode: 'R51', nama: 'Sakit kepala', aktif: true },
  { sistem: 'icd10', kode: 'R50.9', nama: 'Demam, tidak spesifik', aktif: true },
  { sistem: 'icd10', kode: 'A09', nama: 'Diare dan gastroenteritis lain', aktif: true },
  { sistem: 'icd10', kode: 'M54.5', nama: 'Nyeri punggung bawah', aktif: true },
  { sistem: 'icd10', kode: 'L30.9', nama: 'Dermatitis, tidak spesifik', aktif: true },
  { sistem: 'icd9cm', kode: '86.04', nama: 'Insisi dan drainase kulit dan jaringan subkutan', aktif: true },
  { sistem: 'icd9cm', kode: '86.59', nama: 'Penutupan luka dengan jahitan', aktif: true },
  { sistem: 'icd9cm', kode: '89.52', nama: 'Elektrokardiogram', aktif: true },
  { sistem: 'icd9cm', kode: '99.21', nama: 'Injeksi antibiotik', aktif: true },
  { sistem: 'loinc', kode: '8480-6', nama: 'Tekanan darah sistolik', aktif: true },
  { sistem: 'loinc', kode: '8462-4', nama: 'Tekanan darah diastolik', aktif: true },
  { sistem: 'loinc', kode: '8867-4', nama: 'Laju nadi', aktif: true },
  { sistem: 'loinc', kode: '8310-5', nama: 'Suhu tubuh', aktif: true },
  { sistem: 'loinc', kode: '9279-1', nama: 'Laju napas', aktif: true },
  { sistem: 'loinc', kode: '59408-5', nama: 'Saturasi oksigen (SpO2)', aktif: true },
  { sistem: 'loinc', kode: '29463-7', nama: 'Berat badan', aktif: true },
  { sistem: 'loinc', kode: '8302-2', nama: 'Tinggi badan', aktif: true },
  { sistem: 'ucum', kode: 'mm[Hg]', nama: 'milimeter air raksa', aktif: true },
  { sistem: 'ucum', kode: '/min', nama: 'per menit', aktif: true },
  { sistem: 'ucum', kode: 'Cel', nama: 'derajat Celsius', aktif: true },
  { sistem: 'ucum', kode: '%', nama: 'persen', aktif: true },
  { sistem: 'ucum', kode: 'kg', nama: 'kilogram', aktif: true },
  { sistem: 'ucum', kode: 'cm', nama: 'sentimeter', aktif: true },
];

const SAH = new Set<string>(SISTEM_TERMINOLOGI);
const NILAI_NONAKTIF = new Set(['0', 'false', 'tidak', 'nonaktif', 'n']);

/**
 * Baca CSV terminologi: kolom `sistem,kode,nama[,aktif]`, baris judul opsional. Baris tidak sah dikembalikan sebagai galat
 * (nomor baris 1-berbasis).
 */
export function bacaCsvTerminologi(teks: string): { baris: BarisTerminologi[]; galat: string[] } {
  const baris: BarisTerminologi[] = [];
  const galat: string[] = [];
  teks.replace(/^﻿/, '').split(/\r?\n/).forEach((mentah, i) => {
    if (!mentah.trim()) return;
    const [sistem = '', kode = '', nama = '', aktif = ''] = pecahBaris(mentah);
    if (i === 0 && sistem.toLowerCase() === 'sistem') return;
    const s = sistem.toLowerCase();
    if (!SAH.has(s) || !kode || kode.length > 40 || !nama || nama.length > 500) {
      galat.push(`Baris ${i + 1} tidak sah`);
      return;
    }
    baris.push({ sistem: s as SistemTerminologi, kode, nama, aktif: !NILAI_NONAKTIF.has(aktif.toLowerCase()) });
  });
  return { baris, galat };
}

/** Upsert per (sistem, kode); idempoten. `contoh` menandai baris contoh agar tidak tertukar dengan data resmi. */
export async function simpanTerminologi(prisma: PrismaClient, baris: readonly BarisTerminologi[], contoh: boolean): Promise<number> {
  for (const b of baris) {
    await prisma.kodeTerminologi.upsert({
      where: { sistem_kode: { sistem: b.sistem, kode: b.kode } },
      update: { nama: b.nama, aktif: b.aktif, contoh },
      create: { ...b, contoh },
    });
  }
  return baris.length;
}

export const seedTerminologiContoh = (prisma: PrismaClient) => simpanTerminologi(prisma, TERMINOLOGI_CONTOH, true);

export async function imporTerminologiCsv(prisma: PrismaClient, teks: string): Promise<{ diimpor: number; galat: string[] }> {
  const { baris, galat } = bacaCsvTerminologi(teks);
  return { diimpor: await simpanTerminologi(prisma, baris, false), galat };
}

if (require.main === module) {
  const prisma = new PrismaClient();
  const berkas = process.argv[2];
  (berkas ? imporTerminologiCsv(prisma, readFileSync(berkas, 'utf8')) : seedTerminologiContoh(prisma).then((n) => ({ diimpor: n, galat: [] as string[] })))
    .then((h) => { console.log(`Terminologi: ${h.diimpor} baris${berkas ? ' diimpor' : ' contoh'}; ${h.galat.length} baris dilewati`); return prisma.$disconnect(); })
    .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
}
