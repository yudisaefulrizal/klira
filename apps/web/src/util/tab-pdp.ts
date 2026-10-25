import { PDP } from '@klira/shared';

/** Tab halaman Pelindungan data; semuanya dibuka oleh izin `pdp` lihat (halaman sendiri dijaga di menu dan rute). */
export const TABS_PDP = [
  { id: 'persetujuan', label: PDP.tab.persetujuan },
  { id: 'hak', label: PDP.tab.hak },
  { id: 'ropa', label: PDP.tab.ropa },
  { id: 'dpia', label: PDP.tab.dpia },
  { id: 'insiden', label: PDP.tab.insiden },
  { id: 'retensi', label: PDP.tab.retensi },
  { id: 'prosesor', label: PDP.tab.prosesor },
] as const;
export type IdTabPdp = (typeof TABS_PDP)[number]['id'];
