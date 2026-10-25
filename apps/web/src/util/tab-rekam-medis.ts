import { punyaIzin } from '@klira/shared';
import type { IzinAwal } from '@klira/shared';

export const TAB_REKAM_MEDIS = [
  { id: 'berkas', label: 'Berkas pasien', izin: ['rekam-medis', 'lihat'], atau: ['klinis', 'lihat'] },
  { id: 'pengkodean', label: 'Pengkodean dan laporan', izin: ['rekam-medis', 'lihat'] },
  { id: 'perbaikan', label: 'Antrean perbaikan', izin: ['rekam-medis', 'lihat'] },
  { id: 'resume', label: 'Resume dan surat', izin: ['rekam-medis', 'lihat'], atau: ['klinis', 'lihat'] },
  { id: 'pembukaan', label: 'Permintaan pembukaan', izin: ['rekam-medis', 'lihat'] },
  { id: 'penyampaian', label: 'Penyampaian', izin: ['rekam-medis', 'lihat'] },
] as const satisfies readonly { id: string; label: string; izin: readonly [string, 'lihat']; atau?: readonly [string, 'lihat'] }[];

export type IdTabRekamMedis = (typeof TAB_REKAM_MEDIS)[number]['id'];

/** Tab halaman Rekam medis yang boleh dilihat (5.1m): berkas juga untuk pemegang izin klinis lihat (dokter dan perawat memperbaiki catatannya). */
export function tabRekamMedisDiizinkan(pengguna: { izin: readonly IzinAwal[] }) {
  return TAB_REKAM_MEDIS.filter((t) => {
    const alternatif = 'atau' in t ? [t.izin, t.atau] : [t.izin];
    return alternatif.some(([fitur, aksi]) => punyaIzin(pengguna, fitur, aksi));
  });
}
