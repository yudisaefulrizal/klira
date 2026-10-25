import { z } from 'zod';
import { jenisFasyankes } from './entitas';
import { tanggal, teksOpsional, teksWajib } from './umum';

/** Ubah profil klinik (4.1, 4.9): isian langsung, bukan modal. */
export const profilKlinikMasukan = z.object({
  nama: teksWajib(200),
  jenis: jenisFasyankes,
  bentuk_usaha: teksOpsional(100),
  kode_registrasi: teksOpsional(50),
  organization_id: teksOpsional(100),
  status_akreditasi: teksOpsional(100),
  tanggal_akreditasi: tanggal.nullish(),
  puskesmas_wilayah: teksOpsional(200),
});
export type ProfilKlinikMasukan = z.infer<typeof profilKlinikMasukan>;

export type ProfilKlinikDto = {
  id: number;
  nama: string;
  jenis: z.infer<typeof jenisFasyankes>;
  bentuk_usaha: string | null;
  kode_registrasi: string | null;
  organization_id: string | null;
  status_akreditasi: string | null;
  tanggal_akreditasi: string | null;
  puskesmas_wilayah: string | null;
};

export const JENIS_RIWAYAT_PROFIL = ['profil', 'akreditasi', 'sip'] as const;
export type JenisRiwayatProfil = (typeof JENIS_RIWAYAT_PROFIL)[number];
export type RiwayatProfilDto = { id: number; jenis: string; ringkasan: string; dibuat_oleh_nama: string | null; dibuat_pada: string };
