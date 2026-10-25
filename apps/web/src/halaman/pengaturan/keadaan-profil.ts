import { PROFIL_KLINIK, profilKlinikMasukan } from '@klira/shared';
import type { ProfilKlinikDto } from '@klira/shared';
import { galatSkema } from '../../modal/akun-pengaturan/keadaan-akun';
import type { GalatBidang } from '../../modal/akun-pengaturan/keadaan-akun';

/** Isian teks (tanggal berbentuk YYYY-MM-DD) agar kosong bisa dikenali. */
export type FormProfil = {
  nama: string; jenis: string; bentuk_usaha: string; kode_registrasi: string; organization_id: string;
  status_akreditasi: string; tanggal_akreditasi: string; puskesmas_wilayah: string;
};

export const formDariProfil = (p: ProfilKlinikDto): FormProfil => ({
  nama: p.nama, jenis: p.jenis, bentuk_usaha: p.bentuk_usaha ?? '', kode_registrasi: p.kode_registrasi ?? '', organization_id: p.organization_id ?? '',
  status_akreditasi: p.status_akreditasi ?? '', tanggal_akreditasi: p.tanggal_akreditasi ?? '', puskesmas_wilayah: p.puskesmas_wilayah ?? '',
});

const opsional = (t: string) => (t.trim() === '' ? undefined : t.trim());

export const bentukProfil = (f: FormProfil) => ({
  nama: f.nama.trim(), jenis: f.jenis, bentuk_usaha: opsional(f.bentuk_usaha), kode_registrasi: opsional(f.kode_registrasi),
  organization_id: opsional(f.organization_id), status_akreditasi: opsional(f.status_akreditasi),
  tanggal_akreditasi: opsional(f.tanggal_akreditasi), puskesmas_wilayah: opsional(f.puskesmas_wilayah),
});

export const galatProfil = (f: FormProfil): GalatBidang => galatSkema(profilKlinikMasukan, bentukProfil(f));

export const profilBerubah = (awal: FormProfil, f: FormProfil): boolean =>
  (Object.keys(awal) as (keyof FormProfil)[]).some((k) => awal[k].trim() !== f[k].trim());

export const labelJenisRiwayat = (jenis: string): string => PROFIL_KLINIK.riwayatJenis[jenis as keyof typeof PROFIL_KLINIK.riwayatJenis] ?? jenis;
