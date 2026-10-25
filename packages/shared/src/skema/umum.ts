import { z } from 'zod';
import { GALAT, GANTI_KREDENSIAL } from '../teks';

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
/** Kekuatan kata sandi sederhana: 8 sampai 200 karakter, memuat huruf dan angka. */
export const kataSandiBaru = z
  .string()
  .min(8, GANTI_KREDENSIAL.kataSandiPendek)
  .max(200, GANTI_KREDENSIAL.kataSandiPendek)
  .regex(/[A-Za-z]/, GANTI_KREDENSIAL.kataSandiLemah)
  .regex(/\d/, GANTI_KREDENSIAL.kataSandiLemah);

export const gantiKredensial = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, GANTI_KREDENSIAL.usernameFormat)
      .max(100, GANTI_KREDENSIAL.usernameFormat)
      .regex(/^[A-Za-z0-9._-]+$/, GANTI_KREDENSIAL.usernameFormat),
    kata_sandi_lama: z.string().min(1, GALAT.wajibDiisi),
    kata_sandi: kataSandiBaru,
    konfirmasi_kata_sandi: z.string(),
  })
  .refine((d) => d.kata_sandi === d.konfirmasi_kata_sandi, {
    path: ['konfirmasi_kata_sandi'],
    message: GANTI_KREDENSIAL.konfirmasiBeda,
  })
  .refine((d) => d.kata_sandi.toLowerCase() !== d.username.toLowerCase(), {
    path: ['kata_sandi'],
    message: GANTI_KREDENSIAL.kataSandiSamaUsername,
  });
export type MasukanGantiKredensial = z.infer<typeof gantiKredensial>;

/** Kredensial awal statis (2.4); dapat ditimpa lewat USERNAME_AWAL dan KATA_SANDI_AWAL. */
export const KREDENSIAL_AWAL_BAWAAN = { username: 'pimpinan', kataSandi: 'klira-awal-2026' } as const;
export function kredensialAwal(env: Record<string, string | undefined>): { username: string; kataSandi: string } {
  return {
    username: env.USERNAME_AWAL?.trim() || KREDENSIAL_AWAL_BAWAAN.username,
    kataSandi: env.KATA_SANDI_AWAL || KREDENSIAL_AWAL_BAWAAN.kataSandi,
  };
}

export const jejak = z.object({
  fasyankes_id: idPositif,
  dibuat_oleh: idPositif.nullable(),
  dibuat_pada: z.coerce.date(),
});
