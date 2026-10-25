import { z } from 'zod';
import { BAGIAN_KLINIS, POLA_ICD10, POLA_ICD9CM } from '../klinis';
import type { BagianKlinis } from '../klinis';
import { REKAM_MEDIS } from '../teks';
import type { StatusKode, StatusPerbaikan } from '../status';
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

const kodeDiagnosis = z.object({
  kode: z.string().trim().toUpperCase().regex(POLA_ICD10, REKAM_MEDIS.galat.kodeIcd10),
  nama: teksWajib(255),
  peran: z.enum(['utama', 'penyerta']),
});
const kodeTindakan = z.object({ kode: z.string().trim().regex(POLA_ICD9CM, REKAM_MEDIS.galat.kodeIcd9), nama: teksWajib(255) });

/** Pengkodean final (Perekam Medis memverifikasi kode dokter): tepat satu diagnosis utama, kode unik; tindakan boleh kosong. */
export const pengkodeanMasukan = z
  .object({ diagnosis: z.array(kodeDiagnosis).min(1, REKAM_MEDIS.galat.diagnosisWajib).max(30), tindakan: z.array(kodeTindakan).max(30), catatan: teksOpsional(500) })
  .superRefine((d, ctx) => {
    if (d.diagnosis.filter((x) => x.peran === 'utama').length !== 1) ctx.addIssue({ code: 'custom', path: ['diagnosis'], message: REKAM_MEDIS.galat.satuUtama });
    const lihat = new Set<string>();
    d.diagnosis.forEach((x, n) => {
      if (lihat.has(x.kode)) ctx.addIssue({ code: 'custom', path: ['diagnosis', n, 'kode'], message: REKAM_MEDIS.galat.kodeGanda });
      lihat.add(x.kode);
    });
  });
export type PengkodeanMasukan = z.input<typeof pengkodeanMasukan>;
export type PengkodeanIsi = z.output<typeof pengkodeanMasukan>;

export const filterBerkas = z.object({
  cari: z.string().trim().optional(),
  kode: z.preprocess(kosongJadiTiada, z.enum(['belum', 'sudah']).optional()),
  dari: tglIso,
  sampai: tglIso,
  halaman: z.coerce.number().int().min(1).default(1),
  ukuran: z.coerce.number().int().min(1).max(100).default(20),
});
export type FilterBerkas = z.infer<typeof filterBerkas>;

export type BerkasBarisDto = {
  kunjungan_id: number; pasien_id: number; pasien_nama: string; pasien_nomor_rm: string; waktu_tutup: string | null; jenis: 'AMB' | 'IMP'; status_kode: StatusKode;
  diagnosis_dokter: string | null; diagnosis_final: string | null; diarsipkan_pada: string | null; retensi_sampai: string | null; perbaikan_menunggu: number;
};
export type HalamanBerkasDto = { data: BerkasBarisDto[]; halaman: number; ukuran: number; total: number };
export type PengkodeanDto = {
  kunjungan_id: number;
  pasien_nama: string;
  pasien_nomor_rm: string;
  tahap_layanan: string;
  /** Diagnosis dan tindakan yang dicatat dokter (acuan verifikasi). */
  dokter: { diagnosis: { kode: string; nama: string; peran: 'utama' | 'penyerta' }[]; tindakan: { kode: string; nama: string }[] };
  final: PengkodeanIsi | null;
  versi: number | null;
  pengode_nama: string | null;
  diperbarui_pada: string | null;
  diarsipkan_pada: string | null;
  retensi_sampai: string | null;
};
