import { punyaIzin } from '@klira/shared';
import type { IzinAwal } from '@klira/shared';

export const TAB_PENGATURAN = [
  { id: 'pengguna', label: 'Pengguna dan akses', izin: ['akses', 'lihat'] },
  { id: 'jenis-akun', label: 'Jenis akun', izin: ['akses', 'lihat'] },
  { id: 'peringatan', label: 'Daftar peringatan izin', izin: ['akses', 'lihat'] },
  { id: 'master', label: 'Master data', izin: ['akses', 'lihat'] },
  { id: 'profil', label: 'Profil klinik', izin: ['akses', 'lihat'] },
  { id: 'keamanan', label: 'Keamanan', izin: ['akses', 'lihat'] },
  { id: 'audit', label: 'Log audit', izin: ['audit', 'lihat'] },
] as const;

export type IdTabPengaturan = (typeof TAB_PENGATURAN)[number]['id'];

/** Tab halaman Pengaturan yang boleh dilihat akun ini (tab tak diizinkan tidak ditampilkan, 5.1m). */
export function tabPengaturanDiizinkan(pengguna: { izin: readonly IzinAwal[] }) {
  return TAB_PENGATURAN.filter((t) => punyaIzin(pengguna, t.izin[0], t.izin[1]));
}
