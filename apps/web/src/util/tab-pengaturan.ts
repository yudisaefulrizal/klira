import { punyaIzin } from '@klira/shared';
import type { IzinAwal } from '@klira/shared';

export const TAB_PENGATURAN = [
  { id: 'pengguna', label: 'Pengguna dan akses', izin: ['akses', 'lihat'] },
  { id: 'jenis-akun', label: 'Jenis akun', izin: ['akses', 'lihat'] },
  { id: 'peringatan', label: 'Daftar peringatan izin', izin: ['akses', 'lihat'], atau: ['audit', 'lihat'] },
  { id: 'master', label: 'Master data', izin: ['master', 'lihat'] },
  { id: 'profil', label: 'Profil klinik', izin: ['profil-klinik', 'lihat'] },
  { id: 'keamanan', label: 'Keamanan', izin: ['akses', 'lihat'] },
  { id: 'audit', label: 'Log audit', izin: ['audit', 'lihat'] },
] as const satisfies readonly {
  id: string;
  label: string;
  izin: readonly [string, 'lihat'];
  atau?: readonly [string, 'lihat'];
}[];

export type IdTabPengaturan = (typeof TAB_PENGATURAN)[number]['id'];

/** Tab halaman Pengaturan yang boleh dilihat akun ini (tab tak diizinkan tidak ditampilkan, 5.1m).
 * Daftar peringatan terlihat bagi pemegang izin akses atau audit (2.2). */
export function tabPengaturanDiizinkan(pengguna: { izin: readonly IzinAwal[] }) {
  return TAB_PENGATURAN.filter((t) => {
    const alternatif = 'atau' in t ? [t.izin, t.atau] : [t.izin];
    return alternatif.some(([fitur, aksi]) => punyaIzin(pengguna, fitur, aksi));
  });
}
