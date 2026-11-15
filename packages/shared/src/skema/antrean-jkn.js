import { z } from 'zod';
import { ANTREAN_JKN as A } from '../umum/teks.js';
import { idPositif, teksWajib } from './umum.js';

const kosongJadiTiada = (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v);
const kode = z.string().trim().max(20).regex(/^[A-Za-z0-9._-]*$/, A.galat.kode);

/**
 * Pengaturan antrean online BPJS (Mobile JKN). User key kosong berarti tetap memakai yang tersimpan.
 * Pemetaan dengan kode kosong dianggap dihapus.
 */
export const pengaturanAntreanJknMasukan = z.object({
    aktif: z.boolean().default(false),
    service_name: z.preprocess((v) => (v === undefined || v === null || (typeof v === 'string' && v.trim() === '') ? 'antreanfktp' : v), z.string().trim().min(1).max(50).regex(/^[A-Za-z0-9._-]+$/, A.galat.namaLayanan)),
    user_key: z.preprocess(kosongJadiTiada, z.string().max(500).optional()),
    poli: z.array(z.object({ jenis_poli: teksWajib(60), kode })).max(100).default([]),
    dokter: z.array(z.object({ pengguna_id: idPositif, kode })).max(500).default([]),
});
