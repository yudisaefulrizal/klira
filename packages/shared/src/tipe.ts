import type { z } from 'zod';

export type { z };
export type Turunan<S extends z.ZodType> = z.infer<S>;

export type KodeGalat =
  | 'tidak_valid' | 'tidak_terautentikasi' | 'tidak_berizin' | 'tidak_ditemukan' | 'konflik' | 'galat_server';

/** Respons galat seragam dari API. */
export type ResponsGalat = {
  galat: { kode: KodeGalat; pesan: string; rincian?: { jalur: string; pesan: string }[] };
};

export type Halaman<T> = { data: T[]; halaman: number; ukuran: number; total: number };
