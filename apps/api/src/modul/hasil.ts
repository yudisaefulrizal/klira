import type { Response } from 'express';
import { GALAT } from '@klira/shared';
import type { ResponsGalat } from '@klira/shared';
import type { z } from 'zod';

/** Hasil layanan: sukses membawa data, gagal membawa kode galat dan pesan (dipetakan ke status HTTP oleh rute). */
export type Hasil<T> =
  | { ok: true; data: T }
  | { ok: false; kode: 'tidak_valid' | 'konflik' | 'tidak_ditemukan'; pesan: string; rincian?: { jalur: string; pesan: string }[] };

const KODE_HTTP = { tidak_valid: 400, konflik: 409, tidak_ditemukan: 404 } as const;

export const gagal = (kode: 'tidak_valid' | 'konflik' | 'tidak_ditemukan', pesan: string, jalur?: string): Hasil<never> => ({
  ok: false, kode, pesan, ...(jalur ? { rincian: [{ jalur, pesan }] } : {}),
});

export function galatValidasi(res: Response, e: z.ZodError): void {
  const badan: ResponsGalat = {
    galat: { kode: 'tidak_valid', pesan: GALAT.tidakValid, rincian: e.issues.map((i) => ({ jalur: i.path.join('.'), pesan: i.message })) },
  };
  res.status(400).json(badan);
}

export function kirimHasil<T>(res: Response, h: Hasil<T>, statusSukses = 200): void {
  if (h.ok) return void res.status(statusSukses).json({ data: h.data });
  const badan: ResponsGalat = { galat: { kode: h.kode, pesan: h.pesan, ...(h.rincian ? { rincian: h.rincian } : {}) } };
  res.status(KODE_HTTP[h.kode]).json(badan);
}
