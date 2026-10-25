import type { AksesEfektif, KonfirmasiPeringatan, Halaman, PeringatanIzinDto } from '@klira/shared';
import { panggilApi } from './klien';

export type Periode = { mulai: string; selesai?: string | null };
type DenganKonfirmasi = { konfirmasi_peringatan?: KonfirmasiPeringatan };

type Izin = { id: number; fitur: string; aksi: string; cakupan: string };
export type JenisAkunDto = {
  id: number; nama: string; syarat_profesi: string | null; aktif: boolean; alasan_perubahan: string | null; izin: Izin[]; jumlah_pemakai?: number;
};
export type RiwayatDto = { id: number; ringkasan: string; alasan: string | null; dibuat_oleh: number | null; dibuat_pada: string };
export type PenugasanDto = { id: number; pengguna_id: number; jenis_akun_id: number; mulai: string; selesai: string | null };
export type IzinAkunDto = PenugasanDto & { izin_id: number; tipe: 'tambah' | 'kurang'; alasan: string };
export type PeringatanDto = {
  id: number; pengguna_id: number; jenis_peringatan: string; alasan_pimpinan: string; sumber: string;
  diterima_untuk_akun: boolean; waktu: string;
};

export const daftarIzin = () => panggilApi<Izin[]>('GET', '/izin');
export const daftarJenisAkun = () => panggilApi<JenisAkunDto[]>('GET', '/jenis-akun');
export const riwayatJenisAkun = (id: number) => panggilApi<RiwayatDto[]>('GET', `/jenis-akun/${id}/riwayat`);
export const buatJenisAkun = (m: { nama: string; syarat_profesi?: string | null; izin_ids: number[]; alasan_perubahan?: string }) =>
  panggilApi<JenisAkunDto>('POST', '/jenis-akun', m);
export const ubahJenisAkun = (
  id: number,
  m: { nama?: string; syarat_profesi?: string | null; izin_ids?: number[]; aktif?: boolean; alasan_perubahan: string },
) => panggilApi<JenisAkunDto>('PATCH', `/jenis-akun/${id}`, m);

export const daftarPenugasan = (penggunaId: number) => panggilApi<PenugasanDto[]>('GET', `/pengguna/${penggunaId}/penugasan`);
export const tugaskanJenis = (penggunaId: number, m: Periode & DenganKonfirmasi & { jenis_akun_id: number }) =>
  panggilApi<{ penugasan: PenugasanDto }>('POST', `/pengguna/${penggunaId}/penugasan`, m);
export const akhiriPenugasan = (penggunaId: number, id: number, selesai: string) =>
  panggilApi<PenugasanDto>('PATCH', `/pengguna/${penggunaId}/penugasan/${id}`, { selesai });

export const daftarIzinAkun = (penggunaId: number) => panggilApi<IzinAkunDto[]>('GET', `/pengguna/${penggunaId}/izin-akun`);
export const beriIzinAkun = (
  penggunaId: number,
  m: Periode & DenganKonfirmasi & { izin_id: number; tipe: 'tambah' | 'kurang'; alasan: string },
) => panggilApi<{ izin_akun: IzinAkunDto }>('POST', `/pengguna/${penggunaId}/izin-akun`, m);
export const akhiriIzinAkun = (penggunaId: number, id: number, selesai: string) =>
  panggilApi<IzinAkunDto>('PATCH', `/pengguna/${penggunaId}/izin-akun/${id}`, { selesai });

export const aksesEfektif = (penggunaId: number) => panggilApi<AksesEfektif>('GET', `/pengguna/${penggunaId}/akses-efektif`);

export const daftarPeringatan = (f: { halaman: number; ukuran: number; cari?: string; jenis_peringatan?: string; dari?: string; sampai?: string }) => {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) if (v !== undefined && v !== '') q.set(k, String(v));
  return panggilApi<Halaman<PeringatanIzinDto>>('GET', `/peringatan-izin?${q.toString()}`);
};
export const terimaPeringatan = (m: { pengguna_id: number; jenis_peringatan: string; alasan: string }) =>
  panggilApi<PeringatanDto>('POST', '/peringatan-izin/terima', m);
