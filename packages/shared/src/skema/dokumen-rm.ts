import { z } from 'zod';
import { REKAM_MEDIS } from '../teks';
import type { StatusPengesahan } from '../status';
import type { PengesahanDto } from './klinis';
import { teksOpsional, teksWajib } from './umum';

const R = REKAM_MEDIS;
const kosongJadiTiada = (v: unknown) => (v === '' || v === null ? undefined : v);
const tglIso = z.preprocess(kosongJadiTiada, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, R.galat.tanggal).optional());
const teksNull = (maks: number) => z.string().trim().max(maks).nullish().transform((v) => v || null);

// ---- Resume medis dan surat ----
export const JENIS_SURAT = ['rujukan', 'keterangan_sakit', 'lainnya'] as const;
export type JenisSurat = (typeof JENIS_SURAT)[number];

/** Isi resume medis (4.2 Composition): ringkasan perjalanan, diagnosis akhir, terapi, kondisi pulang, anjuran. */
export const resumeIsi = z.object({
  ringkasan: teksWajib(3000),
  diagnosis_akhir: teksWajib(500),
  terapi: teksNull(1000),
  kondisi_pulang: teksWajib(300),
  anjuran: teksNull(1000),
});
export type ResumeIsi = z.output<typeof resumeIsi>;
/** Perubahan resume yang sudah ada butuh alasan (versi lama tersimpan). */
export const resumeMasukan = resumeIsi.extend({ alasan: teksOpsional(500) });
export type ResumeMasukan = z.output<typeof resumeMasukan>;

export const suratMasukan = z
  .object({ jenis: z.enum(JENIS_SURAT, { error: R.galat.jenisSurat }), tujuan: teksNull(200), isi: teksWajib(3000) })
  .superRefine((d, ctx) => {
    if (d.jenis === 'rujukan' && !d.tujuan) ctx.addIssue({ code: 'custom', path: ['tujuan'], message: R.galat.tujuanRujukan });
  });
export type SuratMasukan = z.output<typeof suratMasukan>;

export type SuratDto = { id: number; jenis: JenisSurat; nomor_surat: string; tujuan: string | null; isi: string; dokter_nama: string | null; dibuat_pada: string };
export type ResumeDto = { isi: ResumeIsi; versi: number; pengesahan: PengesahanDto | null; verifikasi: StatusPengesahan; diperbarui_pada: string };
export type DokumenKunjunganDto = {
  kunjungan: { id: number; pasien_id: number; pasien_nama: string; pasien_nomor_rm: string; tahap_layanan: string };
  resume: ResumeDto | null;
  /** Isian awal dari catatan dokter dan pengkodean (boleh diubah). */
  saran: { diagnosis_akhir: string; terapi: string; kondisi_pulang: string };
  surat: SuratDto[];
};

// ---- Pembukaan rekam medis tanpa persetujuan ----
export const ALASAN_HUKUM = ['penegakan_hukum', 'etik_disiplin', 'audit_medis', 'klb_bencana', 'pendidikan_penelitian', 'ancaman_keselamatan'] as const;
export type AlasanHukum = (typeof ALASAN_HUKUM)[number];

/** Permintaan pembukaan (4.4): atas persetujuan pasien atau dasar hukum (dengan alasan sah); cakupan terbatas sesuai kebutuhan; identitas disamarkan untuk dasar hukum tertentu. */
export const pembukaanMasukan = z
  .object({
    pasien_id: z.number().int().positive(),
    pemohon_nama: teksWajib(200),
    pemohon_instansi: teksNull(200),
    dasar: z.enum(['persetujuan', 'hukum'], { error: R.galat.dasar }),
    alasan_hukum: z.union([z.enum(ALASAN_HUKUM), z.literal('')]).nullish().transform((v) => v || undefined),
    dasar_rinci: teksWajib(500),
    cakupan: teksWajib(500),
    identitas_disamarkan: z.boolean().default(true),
  })
  .superRefine((d, ctx) => {
    if (d.dasar === 'hukum' && !d.alasan_hukum) ctx.addIssue({ code: 'custom', path: ['alasan_hukum'], message: R.galat.alasanHukum });
  });
export type PembukaanMasukan = z.output<typeof pembukaanMasukan>;
export type PembukaanForm = z.input<typeof pembukaanMasukan>;

export const filterPembukaan = z.object({
  status: z.preprocess(kosongJadiTiada, z.enum(['diajukan', 'disetujui', 'ditolak']).optional()),
  halaman: z.coerce.number().int().min(1).default(1),
  ukuran: z.coerce.number().int().min(1).max(100).default(20),
});
export type FilterPembukaan = z.infer<typeof filterPembukaan>;
export type PembukaanDto = {
  id: number; pasien_id: number; pasien_nama: string; pasien_nomor_rm: string; pemohon_nama: string; pemohon_instansi: string | null; dasar: 'persetujuan' | 'hukum'; alasan_hukum: AlasanHukum | null;
  dasar_rinci: string; cakupan: string; identitas_disamarkan: boolean; status: 'diajukan' | 'disetujui' | 'ditolak'; penyetuju_nama: string | null; catatan_keputusan: string | null;
  waktu_keputusan: string | null; diminta_oleh_nama: string | null; dibuat_pada: string;
};
export type HalamanPembukaanDto = { data: PembukaanDto[]; halaman: number; ukuran: number; total: number; menunggu: number };

// ---- Penyampaian rekam medis ----
export const HUBUNGAN_PENERIMA = ['pasien', 'wali', 'keluarga', 'pihak_lain'] as const;
export type HubunganPenerima = (typeof HUBUNGAN_PENERIMA)[number];
export const penyampaianMasukan = z
  .object({
    pasien_id: z.number().int().positive(),
    kunjungan_id: z.number().int().positive().nullish(),
    penerima_nama: teksWajib(200),
    hubungan: z.enum(HUBUNGAN_PENERIMA, { error: R.galat.hubungan }),
    bentuk: z.enum(['elektronik', 'cetak'], { error: R.galat.bentuk }),
    bukti_persetujuan: teksNull(300),
    catatan: teksNull(500),
  })
  .superRefine((d, ctx) => {
    if ((d.hubungan === 'keluarga' || d.hubungan === 'pihak_lain') && !d.bukti_persetujuan) ctx.addIssue({ code: 'custom', path: ['bukti_persetujuan'], message: R.galat.buktiWajib });
  });
export type PenyampaianMasukan = z.output<typeof penyampaianMasukan>;
export type PenyampaianForm = z.input<typeof penyampaianMasukan>;
export const filterPenyampaian = z.object({ cari: z.string().trim().optional(), halaman: z.coerce.number().int().min(1).default(1), ukuran: z.coerce.number().int().min(1).max(100).default(20) });
export type FilterPenyampaian = z.infer<typeof filterPenyampaian>;
export type PenyampaianDto = {
  id: number; pasien_id: number; pasien_nama: string; pasien_nomor_rm: string; kunjungan_id: number | null; penerima_nama: string; hubungan: HubunganPenerima; bentuk: 'elektronik' | 'cetak';
  bukti_persetujuan: string | null; catatan: string | null; petugas_nama: string | null; waktu: string;
};
export type HalamanPenyampaianDto = { data: PenyampaianDto[]; halaman: number; ukuran: number; total: number };

// ---- Laporan ----
export const JENIS_LAPORAN = ['kunjungan_per_poli', 'diagnosis_terbanyak', 'status_pengkodean'] as const;
export type JenisLaporan = (typeof JENIS_LAPORAN)[number];
export const filterLaporan = z
  .object({ jenis: z.enum(JENIS_LAPORAN, { error: R.galat.jenisLaporan }), dari: tglIso, sampai: tglIso })
  .superRefine((d, ctx) => {
    if (d.dari && d.sampai && d.dari > d.sampai) ctx.addIssue({ code: 'custom', path: ['sampai'], message: R.galat.rentangTerbalik });
  });
export type FilterLaporan = z.infer<typeof filterLaporan>;
export type LaporanDto = { jenis: JenisLaporan; dari: string; sampai: string; kolom: string[]; baris: (string | number)[][]; total: number };

/** Susun CSV dari laporan (sel berawalan rumus dinetralkan agar aman dibuka di lembar kerja). */
export function laporanKeCsv(l: Pick<LaporanDto, 'kolom' | 'baris'>): string {
  const sel = (v: string | number): string => {
    const t = String(v);
    const aman = /^[=+\-@\t\r]/.test(t) ? `'${t}` : t;
    return /[",\n]/.test(aman) ? `"${aman.replaceAll('"', '""')}"` : aman;
  };
  return [l.kolom, ...l.baris].map((b) => b.map(sel).join(',')).join('\n');
}
