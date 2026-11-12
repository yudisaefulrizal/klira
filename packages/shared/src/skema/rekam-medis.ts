import { z } from 'zod';
import { BAGIAN_KLINIS } from '../klinis';
import type { BagianKlinis } from '../klinis';
import { REKAM_MEDIS } from '../teks';
import type { StatusPerbaikan } from '../status';
import { teksOpsional, teksWajib } from './umum';

const kosongJadiTiada = (v: unknown) => (v === '' || v === null ? undefined : v);
const tglIso = z.preprocess(kosongJadiTiada, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, REKAM_MEDIS.galat.tanggal).optional());

/** Retensi RME 25 tahun sejak kunjungan ditutup (PMK 24/2022 P39). */
export const RETENSI_TAHUN = 25;
/** Tanggal retensi (UTC, tanggal saja) dari waktu tutup: tutup + 25 tahun. */
export function tanggalRetensi(tutup: Date): Date {
  const t = new Date(Date.UTC(tutup.getUTCFullYear() + RETENSI_TAHUN, tutup.getUTCMonth(), tutup.getUTCDate()));
  // 29 Februari tanpa kabisat bergeser ke 1 Maret; kembalikan ke 28 Februari agar tidak lebih lama dari 25 tahun.
  return t.getUTCMonth() !== tutup.getUTCMonth() ? new Date(Date.UTC(tutup.getUTCFullYear() + RETENSI_TAHUN, tutup.getUTCMonth(), 28)) : t;
}

/**
 * Perbaikan catatan klinis: isi baru satu bagian beserta alasan. Pembuat dalam 2x24 jam langsung menerapkan; selebihnya menjadi permintaan yang
 * disetujui orang lain (PMK 24/2022 P30). Isi divalidasi oleh skema bagian di layanan.
 */
export const perbaikanMasukan = z.object({ bagian: z.enum(BAGIAN_KLINIS, { error: REKAM_MEDIS.galat.bagian }), isi: z.unknown(), alasan: teksWajib(500) });
export type PerbaikanMasukan = z.infer<typeof perbaikanMasukan>;

export const keputusanPerbaikanMasukan = z
  .object({ keputusan: z.enum(['setujui', 'tolak'], { error: REKAM_MEDIS.galat.keputusan }), catatan: teksOpsional(500) })
  .superRefine((d, ctx) => {
    if (d.keputusan === 'tolak' && !(d.catatan && d.catatan.trim())) ctx.addIssue({ code: 'custom', path: ['catatan'], message: REKAM_MEDIS.galat.catatanTolak });
  });
export type KeputusanPerbaikanMasukan = z.infer<typeof keputusanPerbaikanMasukan>;

export const filterPerbaikan = z.object({
  status: z.preprocess(kosongJadiTiada, z.enum(['diajukan', 'disetujui', 'ditolak']).optional()),
  halaman: z.coerce.number().int().min(1).default(1),
  ukuran: z.coerce.number().int().min(1).max(100).default(20),
});
export type FilterPerbaikan = z.infer<typeof filterPerbaikan>;

export type PermintaanPerbaikanDto = {
  id: number; kunjungan_id: number; pasien_nama: string; pasien_nomor_rm: string; bagian: BagianKlinis; isi_baru: unknown; isi_sekarang: unknown; alasan: string;
  pemohon_nama: string | null; status: StatusPerbaikan; penyetuju_nama: string | null; catatan_keputusan: string | null; waktu_keputusan: string | null; dibuat_pada: string;
};
export type HalamanPerbaikanDto = { data: PermintaanPerbaikanDto[]; halaman: number; ukuran: number; total: number; menunggu: number };
export type HasilPerbaikanDto = { jenis: 'diterapkan' | 'diajukan'; permintaan: PermintaanPerbaikanDto | null };

export const filterBerkas = z.object({
  cari: z.string().trim().optional(),
  dari: tglIso,
  sampai: tglIso,
  halaman: z.coerce.number().int().min(1).default(1),
  ukuran: z.coerce.number().int().min(1).max(100).default(20),
});
export type FilterBerkas = z.infer<typeof filterBerkas>;

export type BerkasBarisDto = {
  kunjungan_id: number; pasien_id: number; pasien_nama: string; pasien_nomor_rm: string; waktu_tutup: string | null; jenis: 'AMB' | 'IMP';
  diagnosis_dokter: string | null; diarsipkan_pada: string | null; retensi_sampai: string | null; perbaikan_menunggu: number;
};
export type HalamanBerkasDto = { data: BerkasBarisDto[]; halaman: number; ukuran: number; total: number };
