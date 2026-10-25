import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { tingkatWilayah } from '@klira/shared';
import type { z } from '@klira/shared';

export type TingkatWilayah = z.infer<typeof tingkatWilayah>;
export type BarisWilayah = { kode: string; nama: string; tingkat: TingkatWilayah; induk_kode: string | null };

/**
 * Seed kecil CONTOH (bukan data resmi Kemendagri; kode dan nama sengaja fiktif).
 * Data resmi diimpor lewat CSV: `npm run seed:wilayah -w packages/db -- berkas.csv`.
 */
export const WILAYAH_CONTOH: BarisWilayah[] = [
  { kode: '99', nama: 'Provinsi Contoh', tingkat: 'provinsi', induk_kode: null },
  { kode: '99.01', nama: 'Kabupaten Contoh', tingkat: 'kabupaten_kota', induk_kode: '99' },
  { kode: '99.01.01', nama: 'Kecamatan Contoh', tingkat: 'kecamatan', induk_kode: '99.01' },
  { kode: '99.01.01.2001', nama: 'Kelurahan Contoh', tingkat: 'kelurahan_desa', induk_kode: '99.01.01' },
  { kode: '99.01.01.2002', nama: 'Desa Contoh', tingkat: 'kelurahan_desa', induk_kode: '99.01.01' },
];

/** Tingkat dari jumlah segmen kode (titik), bila kolom tingkat kosong: 1 provinsi, 2 kabupaten/kota, 3 kecamatan, 4 kelurahan/desa. */
const tingkatDariKode = (kode: string): TingkatWilayah | null => (['provinsi', 'kabupaten_kota', 'kecamatan', 'kelurahan_desa'] as const)[kode.split('.').length - 1] ?? null;

/** Pecah satu baris CSV sederhana (koma, tanda kutip ganda untuk nilai yang memuat koma). */
export function pecahBaris(baris: string): string[] {
  const hasil: string[] = [];
  let sekarang = '';
  let kutip = false;
  for (let i = 0; i < baris.length; i += 1) {
    const c = baris[i];
    if (c === '"') {
      if (kutip && baris[i + 1] === '"') { sekarang += '"'; i += 1; } else kutip = !kutip;
    } else if (c === ',' && !kutip) { hasil.push(sekarang.trim()); sekarang = ''; } else sekarang += c;
  }
  hasil.push(sekarang.trim());
  return hasil;
}

/**
 * Baca CSV wilayah: kolom `kode,nama[,tingkat[,induk_kode]]`, baris judul opsional.
 * Tingkat dan induk dilengkapi dari kode bila kosong. Baris tidak sah dikembalikan sebagai galat (nomor baris 1-berbasis).
 */
export function bacaCsvWilayah(teks: string): { baris: BarisWilayah[]; galat: string[] } {
  const baris: BarisWilayah[] = [];
  const galat: string[] = [];
  teks.replace(/^﻿/, '').split(/\r?\n/).forEach((mentah, i) => {
    if (!mentah.trim()) return;
    const [kode = '', nama = '', tingkatMentah = '', indukMentah = ''] = pecahBaris(mentah);
    if (i === 0 && kode.toLowerCase() === 'kode') return;
    const tingkat = tingkatMentah ? tingkatWilayah.safeParse(tingkatMentah).data ?? null : tingkatDariKode(kode);
    if (!kode || kode.length > 20 || !nama || nama.length > 200 || !tingkat) { galat.push(`Baris ${i + 1} tidak sah`); return; }
    const segmen = kode.split('.');
    const induk = indukMentah || (segmen.length > 1 ? segmen.slice(0, -1).join('.') : null);
    baris.push({ kode, nama, tingkat, induk_kode: induk });
  });
  return { baris, galat };
}

/** Upsert per kode (idempoten). `contoh` menandai baris contoh agar tidak tertukar dengan data resmi. */
export async function simpanWilayah(prisma: PrismaClient, baris: readonly BarisWilayah[], contoh: boolean): Promise<number> {
  for (const b of baris) {
    await prisma.wilayah.upsert({ where: { kode: b.kode }, update: { nama: b.nama, tingkat: b.tingkat, induk_kode: b.induk_kode, contoh }, create: { ...b, contoh } });
  }
  return baris.length;
}

export const seedWilayahContoh = (prisma: PrismaClient) => simpanWilayah(prisma, WILAYAH_CONTOH, true);

export async function imporWilayahCsv(prisma: PrismaClient, teks: string): Promise<{ diimpor: number; galat: string[] }> {
  const { baris, galat } = bacaCsvWilayah(teks);
  return { diimpor: await simpanWilayah(prisma, baris, false), galat };
}

if (require.main === module) {
  const prisma = new PrismaClient();
  const berkas = process.argv[2];
  (berkas ? imporWilayahCsv(prisma, readFileSync(berkas, 'utf8')) : seedWilayahContoh(prisma).then((n) => ({ diimpor: n, galat: [] as string[] })))
    .then((h) => { console.log(`Wilayah: ${h.diimpor} baris${berkas ? ' diimpor' : ' contoh'}; ${h.galat.length} baris dilewati`); return prisma.$disconnect(); })
    .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
}
