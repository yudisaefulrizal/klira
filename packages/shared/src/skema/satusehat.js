import { z } from 'zod';
import { PENGATURAN_SATUSEHAT as S } from '../umum/teks.js';
import { teksWajib } from './umum.js';
export const LINGKUNGAN_SATUSEHAT = ['sandbox', 'produksi'];
export const lingkunganSatusehat = z.enum(LINGKUNGAN_SATUSEHAT);
const kosongJadiTiada = (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v);
/** Simpan konfigurasi satu lingkungan. Rahasia kosong berarti tetap memakai yang tersimpan. Alamat kosong berarti alamat resmi lingkungan. */
export const konfigurasiSatusehatMasukan = z.object({
    environment: lingkunganSatusehat,
    client_id: teksWajib(200),
    client_secret: z.preprocess(kosongJadiTiada, z.string().max(500).optional()),
    base_url: z.preprocess(kosongJadiTiada, z.string().trim().max(300).url(S.galat.alamat).nullish()),
});
export const lingkunganParam = z.object({ environment: lingkunganSatusehat });
