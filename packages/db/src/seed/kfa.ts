import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { pecahBaris } from './wilayah';

export type BarisKfa = {
  kode: string; tingkat: number; nama: string; bentuk_sediaan: string | null; rute: string | null; satuan: string | null; kekuatan: string | null;
  nomor_izin_edar: string | null; produsen: string | null; generik: boolean; status: string; produk_pengganti_kode: string | null;
};

const kfa = (kode: string, nama: string, bentuk: string, rute: string, satuan: string, kekuatan: string): BarisKfa => ({
  kode, tingkat: 92, nama, bentuk_sediaan: bentuk, rute, satuan, kekuatan, nomor_izin_edar: null, produsen: null, generik: true, status: 'aktif', produk_pengganti_kode: null,
});

/**
 * Seed kecil CONTOH Referensi KFA (4.3), hanya agar master obat dapat dicoba. BUKAN data resmi: kode `contoh-*` dan baris bertanda `contoh`.
 * Kode resmi (tingkat 91 bahan, 92 template, 93 produk, 94 kemasan) diimpor dari API KFA lewat CSV (`npm run seed:kfa -w packages/db -- berkas.csv`).
 */
export const KFA_CONTOH: BarisKfa[] = [
  kfa('contoh-0001', 'Parasetamol 500 mg tablet', 'tablet', 'oral', 'tablet', '500 mg'),
  kfa('contoh-0002', 'Amoksisilin 500 mg kapsul', 'kapsul', 'oral', 'kapsul', '500 mg'),
  kfa('contoh-0003', 'Amlodipin 5 mg tablet', 'tablet', 'oral', 'tablet', '5 mg'),
  kfa('contoh-0004', 'Metformin 500 mg tablet', 'tablet', 'oral', 'tablet', '500 mg'),
  kfa('contoh-0005', 'Cetirizin 10 mg tablet', 'tablet', 'oral', 'tablet', '10 mg'),
  kfa('contoh-0006', 'Omeprazol 20 mg kapsul', 'kapsul', 'oral', 'kapsul', '20 mg'),
  kfa('contoh-0007', 'Ibuprofen 400 mg tablet', 'tablet', 'oral', 'tablet', '400 mg'),
  kfa('contoh-0008', 'Natrium diklofenak 50 mg tablet', 'tablet', 'oral', 'tablet', '50 mg'),
  kfa('contoh-0009', 'Salbutamol 2 mg tablet', 'tablet', 'oral', 'tablet', '2 mg'),
  kfa('contoh-0010', 'Cairan oralit', 'serbuk', 'oral', 'sachet', '-'),
];

const NILAI_NONAKTIF = new Set(['0', 'false', 'tidak', 'nonaktif', 'n']);
const kosongNull = (v: string | undefined): string | null => (v && v.trim() ? v.trim() : null);

/**
 * Baca CSV KFA: kolom `kode,tingkat,nama[,bentuk_sediaan,rute,satuan,kekuatan,nomor_izin_edar,produsen,generik,status,produk_pengganti_kode]`,
 * baris judul opsional. Tingkat harus 91, 92, 93, atau 94. Baris tidak sah dikembalikan sebagai galat (nomor baris 1-berbasis).
 */
export function bacaCsvKfa(teks: string): { baris: BarisKfa[]; galat: string[] } {
  const baris: BarisKfa[] = [];
  const galat: string[] = [];
  teks.replace(/^﻿/, '').split(/\r?\n/).forEach((mentah, i) => {
    if (!mentah.trim()) return;
    const [kode = '', tingkat = '', nama = '', bentuk, rute, satuan, kekuatan, izin, produsen, generik = '', status = '', pengganti] = pecahBaris(mentah);
    if (i === 0 && kode.toLowerCase() === 'kode') return;
    const t = Number(tingkat);
    if (!kode || kode.length > 30 || ![91, 92, 93, 94].includes(t) || !nama || nama.length > 255) {
      galat.push(`Baris ${i + 1} tidak sah`);
      return;
    }
    baris.push({
      kode, tingkat: t, nama, bentuk_sediaan: kosongNull(bentuk), rute: kosongNull(rute), satuan: kosongNull(satuan), kekuatan: kosongNull(kekuatan), nomor_izin_edar: kosongNull(izin),
      produsen: kosongNull(produsen), generik: !NILAI_NONAKTIF.has(generik.toLowerCase()) && generik !== '', status: kosongNull(status) ?? 'aktif', produk_pengganti_kode: kosongNull(pengganti),
    });
  });
  return { baris, galat };
}

/** Upsert per kode; idempoten. */
export async function simpanKfa(prisma: PrismaClient, baris: readonly BarisKfa[], contoh: boolean): Promise<number> {
  for (const b of baris) {
    await prisma.referensiKfa.upsert({ where: { kode: b.kode }, update: { ...b, contoh, diperbarui_pada: new Date() }, create: { ...b, contoh } });
  }
  return baris.length;
}

export const seedKfaContoh = (prisma: PrismaClient) => simpanKfa(prisma, KFA_CONTOH, true);

export async function imporKfaCsv(prisma: PrismaClient, teks: string): Promise<{ diimpor: number; galat: string[] }> {
  const { baris, galat } = bacaCsvKfa(teks);
  return { diimpor: await simpanKfa(prisma, baris, false), galat };
}

if (require.main === module) {
  const prisma = new PrismaClient();
  const berkas = process.argv[2];
  (berkas ? imporKfaCsv(prisma, readFileSync(berkas, 'utf8')) : seedKfaContoh(prisma).then((n) => ({ diimpor: n, galat: [] as string[] })))
    .then((h) => { console.log(`KFA: ${h.diimpor} baris${berkas ? ' diimpor' : ' contoh'}; ${h.galat.length} baris dilewati`); return prisma.$disconnect(); })
    .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
}
