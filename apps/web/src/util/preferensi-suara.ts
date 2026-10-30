type SimpananSuara = Pick<Storage, 'getItem' | 'setItem'>;
export function kunciPreferensiSuara(fasilitas?: string): string | null {
  if (!fasilitas || !/^\d+$/.test(fasilitas)) return null;
  const id = Number(fasilitas);
  return Number.isSafeInteger(id) && id > 0 ? `klira.panggilan.suara.${id}` : null;
}
export function bacaPreferensiSuara(fasilitas?: string, penyimpanan?: SimpananSuara): boolean {
  const kunci = kunciPreferensiSuara(fasilitas);
  if (!kunci) return false;
  try { return (penyimpanan ?? localStorage).getItem(kunci) === 'aktif'; } catch { return false; }
}
export function simpanPreferensiSuara(fasilitas: string | undefined, aktif: boolean, penyimpanan?: SimpananSuara): boolean {
  const kunci = kunciPreferensiSuara(fasilitas);
  if (!kunci) return false;
  try { (penyimpanan ?? localStorage).setItem(kunci, aktif ? 'aktif' : 'nonaktif'); return true; } catch { return false; }
}
