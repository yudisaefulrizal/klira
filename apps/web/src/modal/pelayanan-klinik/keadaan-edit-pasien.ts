export const TAB_EDIT_PASIEN = [
  { id: 'edit-identitas', label: 'Data utama' },
  { id: 'edit-pelengkap', label: 'Pelengkap' },
  { id: 'edit-keluarga', label: 'Keluarga' },
  { id: 'edit-jkn', label: 'JKN' },
] as const;
export type TabEditPasien = typeof TAB_EDIT_PASIEN[number]['id'];

/** Open the section containing the first invalid field, including a hidden guardian. */
export function lokasiGalatEditPasien(jalur: string): { tab: TabEditPasien; wali?: number } {
  if (jalur === 'tidak_cakap' || jalur === 'wali' || jalur.startsWith('wali.')) {
    const indeks = Number(jalur.split('.')[1]);
    return { tab: 'edit-keluarga', ...(Number.isInteger(indeks) && indeks >= 0 ? { wali: indeks } : {}) };
  }
  if (jalur.startsWith('jkn_')) return { tab: 'edit-jkn' };
  if (['tempat_lahir', 'ibu_kandung', 'alamat', 'kode_wilayah', 'suku', 'bahasa'].includes(jalur)) return { tab: 'edit-pelengkap' };
  return { tab: 'edit-identitas' };
}
