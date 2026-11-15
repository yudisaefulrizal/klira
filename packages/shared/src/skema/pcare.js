import { z } from 'zod';
import { PENGATURAN_PCARE as P } from '../umum/teks.js';
import { teksWajib } from './umum.js';
import { lingkunganSatusehat } from './satusehat.js';

const kosongJadiTiada = (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v);
const rahasia = z.preprocess(kosongJadiTiada, z.string().max(500).optional());

/** Simpan konfigurasi PCare satu lingkungan. Rahasia kosong berarti tetap memakai yang tersimpan; alamat kosong memakai alamat resmi. */
export const konfigurasiPcareMasukan = z.object({
    environment: lingkunganSatusehat,
    cons_id: teksWajib(50),
    secret_key: rahasia,
    user_key: rahasia,
    username: teksWajib(100),
    password: rahasia,
    app_code: teksWajib(20),
    base_url: z.preprocess(kosongJadiTiada, z.string().trim().max(300).url(P.galat.alamat).nullish()),
    service_name: z.preprocess((v) => (v === undefined || v === null || (typeof v === 'string' && v.trim() === '') ? 'pcare-rest' : v), z.string().trim().min(1).max(50).regex(/^[A-Za-z0-9._-]+$/, P.galat.namaLayanan)),
});
