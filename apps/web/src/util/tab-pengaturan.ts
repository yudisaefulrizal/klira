import { punyaIzin } from '@klira/shared';
import type { IzinAwal } from '@klira/shared';

type DefinisiTab = {
  id: string;
  label: string;
  izin: readonly [string, 'lihat'];
  atau?: readonly [string, 'lihat'];
};

/** Pengaturan dipecah menjadi halaman menurut kebutuhan: akses dan keamanan, serta pengaturan klinik. Master data tidak punya halaman sendiri: dikelola dari modul pemiliknya. */
export const HALAMAN_PENGATURAN = {
  akses: {
    path: '/akses',
    judul: 'Akses dan keamanan',
    tab: [
      { id: 'pengguna', label: 'Pengguna dan akses', izin: ['akses', 'lihat'] },
      { id: 'jenis-akun', label: 'Jenis akun', izin: ['akses', 'lihat'] },
      { id: 'peringatan', label: 'Daftar peringatan izin', izin: ['akses', 'lihat'], atau: ['audit', 'lihat'] },
      { id: 'keamanan', label: 'Keamanan', izin: ['akses', 'lihat'] },
    ],
  },
  klinik: {
    path: '/pengaturan-klinik',
    judul: 'Pengaturan klinik',
    tab: [
      { id: 'profil', label: 'Profil klinik', izin: ['profil-klinik', 'lihat'] },
      { id: 'backup', label: 'Backup', izin: ['akses', 'lihat'] },
    ],
  },
} as const satisfies Record<string, { path: string; judul: string; tab: readonly DefinisiTab[] }>;

export type IdHalamanPengaturan = keyof typeof HALAMAN_PENGATURAN;
export type IdTabAkses = (typeof HALAMAN_PENGATURAN.akses.tab)[number]['id'];
export type IdTabKlinik = (typeof HALAMAN_PENGATURAN.klinik.tab)[number]['id'];

/** Tab halaman ini yang boleh dilihat akun ini (tab tak diizinkan tidak ditampilkan, 5.1m).
 * Daftar peringatan terlihat bagi pemegang izin akses atau audit (2.2). */
export function tabDiizinkan<T extends readonly DefinisiTab[]>(daftar: T, pengguna: { izin: readonly IzinAwal[] }): T[number][] {
  return daftar.filter((t) => {
    const alternatif = t.atau ? [t.izin, t.atau] : [t.izin];
    return alternatif.some(([fitur, aksi]) => punyaIzin(pengguna, fitur, aksi));
  });
}
