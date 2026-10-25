import type {
  DokumenKunjunganDto, FilterLaporan, HalamanPembukaanDto, HalamanPenyampaianDto, LaporanDto, PembukaanDto, PembukaanForm, PenyampaianForm, ResumeMasukan, SuratDto, SuratMasukan,
} from '@klira/shared';
import { panggilApi } from './klien';

const kueri = (o: Record<string, string | number | undefined>): string => {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(o)) if (v !== undefined && v !== '') q.set(k, String(v));
  return q.toString();
};

export const ambilDokumen = (kunjunganId: number) => panggilApi<DokumenKunjunganDto>('GET', `/kunjungan/${kunjunganId}/dokumen`);
export const simpanResume = (kunjunganId: number, m: Partial<ResumeMasukan>) => panggilApi<DokumenKunjunganDto>('PUT', `/kunjungan/${kunjunganId}/resume`, m);
export const buatSurat = (kunjunganId: number, m: Pick<SuratMasukan, 'jenis' | 'tujuan' | 'isi'>) => panggilApi<SuratDto>('POST', `/kunjungan/${kunjunganId}/surat`, m);

export const daftarPembukaan = (f: { status?: string; halaman?: number; ukuran?: number }) => panggilApi<HalamanPembukaanDto>('GET', `/rekam-medis/pembukaan?${kueri({ halaman: f.halaman ?? 1, ukuran: f.ukuran ?? 20, status: f.status })}`);
export const ajukanPembukaan = (m: PembukaanForm) => panggilApi<{ id: number }>('POST', '/rekam-medis/pembukaan', m);
export const putuskanPembukaan = (id: number, m: { keputusan: 'setujui' | 'tolak'; catatan?: string }) => panggilApi<PembukaanDto>('POST', `/rekam-medis/pembukaan/${id}/keputusan`, m);

export const daftarPenyampaian = (f: { cari?: string; halaman?: number; ukuran?: number }) => panggilApi<HalamanPenyampaianDto>('GET', `/rekam-medis/penyampaian?${kueri({ halaman: f.halaman ?? 1, ukuran: f.ukuran ?? 20, cari: f.cari?.trim() })}`);
export const catatPenyampaian = (m: PenyampaianForm) => panggilApi<{ id: number }>('POST', '/rekam-medis/penyampaian', m);

export const buatLaporan = (f: { jenis: FilterLaporan['jenis']; dari?: string; sampai?: string }) => panggilApi<LaporanDto>('GET', `/rekam-medis/laporan?${kueri(f)}`);
