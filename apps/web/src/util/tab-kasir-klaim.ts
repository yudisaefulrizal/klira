import { punyaIzin } from '@klira/shared';
import type { IzinAwal } from '@klira/shared';

export const TAB_KASIR_KLAIM = [
  { id: 'shift', label: 'Shift dan rekap harian', izin: ['kasir', 'lihat'] },
  { id: 'klaim', label: 'Klaim JKN/BPJS', izin: ['klaim', 'lihat'] },
] as const satisfies readonly { id: string; label: string; izin: readonly [string, 'lihat'] }[];

export type IdTabKasirKlaim = (typeof TAB_KASIR_KLAIM)[number]['id'];

/** Tab halaman Kasir dan klaim yang boleh dilihat (5.1m): Shift untuk kasir, Klaim untuk petugas klaim. */
export function tabKasirKlaimDiizinkan(pengguna: { izin: readonly IzinAwal[] }) {
  return TAB_KASIR_KLAIM.filter((t) => punyaIzin(pengguna, t.izin[0], t.izin[1]));
}
