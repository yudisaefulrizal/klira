import type { z } from 'zod';
import type { IzinAwal, JenisPeringatan } from './izin';

export type { z };
export type Turunan<S extends z.ZodType> = z.infer<S>;

export type KodeGalat =
  | 'tidak_valid' | 'tidak_terautentikasi' | 'tidak_berizin' | 'tidak_ditemukan' | 'konflik' | 'perlu_konfirmasi_peringatan' | 'terlalu_banyak' | 'wajib_ganti_kredensial' | 'galat_server';

/** Respons galat seragam dari API. */
export type ResponsGalat = {
  galat: { kode: KodeGalat; pesan: string; rincian?: { jalur: string; pesan: string }[]; peringatan?: PeringatanTerdeteksi[] };
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
  izin: IzinAwal[];
  halaman_awal: string;
};

/** Peringatan izin hasil evaluasi (2.2). */
export type PeringatanTerdeteksi = {
  jenis: JenisPeringatan;
  kunci: string;
  pesan: string;
  izin?: IzinAwal;
  penugasan_id?: number;
};

export type AksesEfektif = {
  pengguna_id: number;
  jenis_akun: string[];
  izin: IzinAwal[];
  fitur: string[];
};

export type RingkasanIzin = IzinAwal & { id: number };
