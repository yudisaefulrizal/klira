import { filterLaporan, pembukaanMasukan, penyampaianMasukan, resumeMasukan, suratMasukan } from '@klira/shared';
import type { DokumenKunjunganDto, PembukaanForm, PenyampaianForm, ResumeMasukan } from '@klira/shared';

type Isu = { path: PropertyKey[]; message: string };
const petakan = (isu: readonly Isu[] | undefined): Record<string, string> => {
  const g: Record<string, string> = {};
  for (const i of isu ?? []) g[i.path.map(String).join('.') || ''] ??= i.message;
  return g;
};

// ---- Resume dan surat (MODAL-BERTAHAP: Resume > Kondisi pulang > Surat > Ringkasan) ----
export type KeadaanResume = { ringkasan: string; diagnosis_akhir: string; terapi: string; kondisi_pulang: string; anjuran: string; alasan: string; surat_jenis: 'rujukan' | 'keterangan_sakit' | 'lainnya'; surat_tujuan: string; surat_isi: string };

/** Isi awal dari resume tersimpan; bila belum ada, dari saran (diagnosis dan tindakan kunjungan). */
export function awalResume(d: DokumenKunjunganDto | null): KeadaanResume {
  const r = d?.resume?.isi;
  return {
    ringkasan: r?.ringkasan ?? '', diagnosis_akhir: r?.diagnosis_akhir ?? d?.saran.diagnosis_akhir ?? '', terapi: r?.terapi ?? d?.saran.terapi ?? '', kondisi_pulang: r?.kondisi_pulang ?? d?.saran.kondisi_pulang ?? '',
    anjuran: r?.anjuran ?? '', alasan: '', surat_jenis: 'rujukan', surat_tujuan: '', surat_isi: '',
  };
}

export const bentukResume = (k: KeadaanResume, ada: boolean): Partial<ResumeMasukan> => ({
  ringkasan: k.ringkasan, diagnosis_akhir: k.diagnosis_akhir, terapi: k.terapi, kondisi_pulang: k.kondisi_pulang, anjuran: k.anjuran, ...(ada ? { alasan: k.alasan } : {}),
});
/** Resume tidak berubah dari yang tersimpan (tidak perlu disimpan ulang). */
export function resumeSama(k: KeadaanResume, d: DokumenKunjunganDto | null): boolean {
  const r = d?.resume?.isi;
  return !!r && r.ringkasan === k.ringkasan.trim() && r.diagnosis_akhir === k.diagnosis_akhir.trim() && (r.terapi ?? '') === k.terapi.trim() && r.kondisi_pulang === k.kondisi_pulang.trim() && (r.anjuran ?? '') === k.anjuran.trim();
}
export const adaSuratBaru = (k: KeadaanResume): boolean => k.surat_isi.trim().length > 0;
export const bentukSurat = (k: KeadaanResume) => ({ jenis: k.surat_jenis, tujuan: k.surat_tujuan, isi: k.surat_isi });

/** Galat per bidang; alasan wajib hanya bila resume sudah ada dan isinya berubah. Surat divalidasi hanya bila isinya diisi. */
export function galatResume(k: KeadaanResume, d: DokumenKunjunganDto | null): Record<string, string> {
  const ada = !!d?.resume;
  const g = ada && resumeSama(k, d) ? {} : petakan(resumeMasukan.safeParse(bentukResume(k, ada)).error?.issues);
  if (ada && !resumeSama(k, d) && !k.alasan.trim()) g.alasan = 'Alasan wajib untuk mengubah resume yang sudah disahkan.';
  if (adaSuratBaru(k)) for (const [a, b] of Object.entries(petakan(suratMasukan.safeParse(bentukSurat(k)).error?.issues))) g[`surat_${a}`] = b;
  return g;
}
/** Indeks langkah pertama bermasalah (0 resume, 1 kondisi pulang, 2 surat) atau -1. */
export function langkahBermasalahResume(g: Record<string, string>): number {
  if (g.ringkasan || g.diagnosis_akhir || g.terapi) return 0;
  if (g.kondisi_pulang || g.anjuran || g.alasan) return 1;
  if (g.surat_jenis || g.surat_tujuan || g.surat_isi) return 2;
  return -1;
}

// ---- Permintaan pembukaan (MODAL-BERTAHAP: Pemohon > Dasar dan cakupan > Ringkasan) ----
export type KeadaanPembukaan = { pasien_id: number | null; pemohon_nama: string; pemohon_instansi: string; dasar: 'persetujuan' | 'hukum'; alasan_hukum: string; dasar_rinci: string; cakupan: string; identitas_disamarkan: boolean };
export const awalPembukaan = (): KeadaanPembukaan => ({ pasien_id: null, pemohon_nama: '', pemohon_instansi: '', dasar: 'hukum', alasan_hukum: '', dasar_rinci: '', cakupan: '', identitas_disamarkan: true });
export const bentukPembukaan = (k: KeadaanPembukaan): PembukaanForm => ({ ...k, pasien_id: k.pasien_id ?? 0, alasan_hukum: (k.alasan_hukum || undefined) as PembukaanForm['alasan_hukum'] });
export const galatPembukaan = (k: KeadaanPembukaan): Record<string, string> => petakan(pembukaanMasukan.safeParse(bentukPembukaan(k)).error?.issues);
export function langkahBermasalahPembukaan(g: Record<string, string>): number {
  if (g.pasien_id || g.pemohon_nama || g.pemohon_instansi) return 0;
  if (g.dasar || g.alasan_hukum || g.dasar_rinci || g.cakupan) return 1;
  return -1;
}

// ---- Penyampaian ----
export type KeadaanPenyampaian = { pasien_id: number | null; penerima_nama: string; hubungan: 'pasien' | 'wali' | 'keluarga' | 'pihak_lain'; bentuk: 'elektronik' | 'cetak'; bukti_persetujuan: string; catatan: string };
export const awalPenyampaian = (): KeadaanPenyampaian => ({ pasien_id: null, penerima_nama: '', hubungan: 'pasien', bentuk: 'cetak', bukti_persetujuan: '', catatan: '' });
export const bentukPenyampaian = (k: KeadaanPenyampaian): PenyampaianForm => ({ ...k, pasien_id: k.pasien_id ?? 0 });
export const galatPenyampaian = (k: KeadaanPenyampaian): Record<string, string> => petakan(penyampaianMasukan.safeParse(bentukPenyampaian(k)).error?.issues);

// ---- Laporan ----
export type KeadaanLaporan = { jenis: 'kunjungan_per_poli' | 'diagnosis_terbanyak' | 'status_pengkodean'; dari: string; sampai: string };
export const awalLaporan = (): KeadaanLaporan => ({ jenis: 'kunjungan_per_poli', dari: '', sampai: '' });
export const galatLaporan = (k: KeadaanLaporan): Record<string, string> => petakan(filterLaporan.safeParse(k).error?.issues);
