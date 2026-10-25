import type { z } from 'zod';

export type { z };
export type Turunan<S extends z.ZodType> = z.infer<S>;

export type KodeGalat =
  | 'tidak_valid' | 'tidak_terautentikasi' | 'tidak_berizin' | 'tidak_ditemukan' | 'konflik' | 'terlalu_banyak' | 'wajib_ganti_kredensial' | 'galat_server';

/** Respons galat seragam dari API. */
export type ResponsGalat = {
  galat: { kode: KodeGalat; pesan: string; rincian?: { jalur: string; pesan: string }[] };
};

export type Halaman<T> = { data: T[]; halaman: number; ukuran: number; total: number };

/** Respons GET /api/saya dan POST /api/masuk. */
export type PenggunaSaya = {
  id: number;
  nama: string;
  username: string;
  fasyankes_id: number;
  wajib_ganti_kredensial: boolean;
  jenis_akun: string[];
  fitur: string[];
  halaman_awal: string;
};
