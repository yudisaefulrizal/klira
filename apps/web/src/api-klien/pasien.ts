import type {
  PerbaikanPasienKirim, CekDuplikatMasukan, DaftarPasienDto, KandidatDuplikatDto, PasienBaruDto, PasienDetailDto, RegistrasiPasienKirim, TahapFilter, TeksPersetujuanDto,
} from '@klira/shared';
import { panggilApi } from './klien';

export type SaringanPasien = { tanggal?: string; untuk_kunjungan?: boolean; cari?: string; tahap?: TahapFilter; halaman: number; ukuran: number };

export function queryDaftarPasien(f: SaringanPasien): string {
  const q = new URLSearchParams({ halaman: String(f.halaman), ukuran: String(f.ukuran) });
  if (f.untuk_kunjungan) q.set('untuk_kunjungan', 'true');
  if (f.tanggal) q.set('tanggal', f.tanggal);
  if (f.cari?.trim()) q.set('cari', f.cari.trim());
  if (f.tahap && f.tahap !== 'semua') q.set('tahap', f.tahap);
  return q.toString();
}

export const daftarPasien = (f: SaringanPasien) => panggilApi<DaftarPasienDto>('GET', `/pasien?${queryDaftarPasien(f)}`);
/** Membuka isi data pasien; tercatat di audit (lihat). */
export const detailPasien = (id: number) => panggilApi<PasienDetailDto>('GET', `/pasien/${id}`);
export const cekDuplikatPasien = (m: Partial<CekDuplikatMasukan>) => panggilApi<KandidatDuplikatDto[]>('POST', '/pasien/cek-duplikat', m);
export const teksGeneralConsent = () => panggilApi<TeksPersetujuanDto>('GET', '/pasien/teks-persetujuan');
export const registrasiPasien = (m: RegistrasiPasienKirim) => panggilApi<PasienBaruDto>('POST', '/pasien', m);

export const perbaikiPasien = (id: number, data: PerbaikanPasienKirim) => panggilApi<PasienDetailDto>('PATCH', `/pasien/${id}`, data);
