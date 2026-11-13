import { z } from 'zod';
import { BAGIAN_KLINIS } from '../klinis/klinis.js';
import { REKAM_MEDIS } from '../umum/teks.js';
import { teksOpsional, teksWajib } from './umum.js';
const kosongJadiTiada = (v) => (v === '' || v === null ? undefined : v);
const tglIso = z.preprocess(kosongJadiTiada, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, REKAM_MEDIS.galat.tanggal).optional());
/** Retensi RME 25 tahun sejak kunjungan ditutup (PMK 24/2022 P39). */
export const RETENSI_TAHUN = 25;
/** Tanggal retensi (UTC, tanggal saja) dari waktu tutup: tutup + 25 tahun. */
export function tanggalRetensi(tutup) {
    const t = new Date(Date.UTC(tutup.getUTCFullYear() + RETENSI_TAHUN, tutup.getUTCMonth(), tutup.getUTCDate()));
    // 29 Februari tanpa kabisat bergeser ke 1 Maret; kembalikan ke 28 Februari agar tidak lebih lama dari 25 tahun.
    return t.getUTCMonth() !== tutup.getUTCMonth() ? new Date(Date.UTC(tutup.getUTCFullYear() + RETENSI_TAHUN, tutup.getUTCMonth(), 28)) : t;
}
/**
 * Perbaikan catatan klinis: isi baru satu bagian beserta alasan. Pembuat dalam 2x24 jam langsung menerapkan; selebihnya menjadi permintaan yang
 * disetujui orang lain (PMK 24/2022 P30). Isi divalidasi oleh skema bagian di layanan.
 */
export const perbaikanMasukan = z.object({ bagian: z.enum(BAGIAN_KLINIS, { error: REKAM_MEDIS.galat.bagian }), isi: z.unknown(), alasan: teksWajib(500) });
export const keputusanPerbaikanMasukan = z
    .object({ keputusan: z.enum(['setujui', 'tolak'], { error: REKAM_MEDIS.galat.keputusan }), catatan: teksOpsional(500) })
    .superRefine((d, ctx) => {
    if (d.keputusan === 'tolak' && !(d.catatan && d.catatan.trim()))
        ctx.addIssue({ code: 'custom', path: ['catatan'], message: REKAM_MEDIS.galat.catatanTolak });
});
export const filterPerbaikan = z.object({
    status: z.preprocess(kosongJadiTiada, z.enum(['diajukan', 'disetujui', 'ditolak']).optional()),
    halaman: z.coerce.number().int().min(1).default(1),
    ukuran: z.coerce.number().int().min(1).max(100).default(20),
});
export const filterBerkas = z.object({
    cari: z.string().trim().optional(),
    dari: tglIso,
    sampai: tglIso,
    halaman: z.coerce.number().int().min(1).default(1),
    ukuran: z.coerce.number().int().min(1).max(100).default(20),
});
