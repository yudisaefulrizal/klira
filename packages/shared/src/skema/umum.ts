import { z } from 'zod';
import { GALAT } from '../teks';

export const NIK_REGEX = /^\d{16}$/;
export const TANGGAL_MINIMAL = new Date('2014-06-03T00:00:00.000Z');

export const nik = z.string().regex(NIK_REGEX, GALAT.nik);
export const idPositif = z.number().int().positive();
export const teksWajib = (maks = 200) => z.string().trim().min(1, GALAT.wajibDiisi).max(maks);
export const teksOpsional = (maks = 200) => z.string().trim().max(maks).nullish();
/** Tanggal/waktu (UTC), tidak sebelum 2014-06-03. */
export const tanggal = z.coerce
  .date()
  .refine((t) => t.getTime() >= TANGGAL_MINIMAL.getTime(), GALAT.tanggal);
export const alasan = z.string().trim().min(1, GALAT.alasanWajib);

export const paginasi = z.object({
  halaman: z.coerce.number().int().min(1).default(1),
  ukuran: z.coerce.number().int().min(1).max(100).default(20),
  cari: z.string().trim().optional(),
});
export const idParam = z.object({ id: z.coerce.number().int().positive() });
export const masuk = z.object({
  username: z.string().trim().min(1, GALAT.wajibDiisi),
  kata_sandi: z.string().min(1, GALAT.wajibDiisi),
});
export const gantiKredensial = z.object({
  username: z.string().trim().min(3).max(100),
  kata_sandi: z.string().min(8).max(200),
});

export const jejak = z.object({
  fasyankes_id: idPositif,
  dibuat_oleh: idPositif.nullable(),
  dibuat_pada: z.coerce.date(),
});
