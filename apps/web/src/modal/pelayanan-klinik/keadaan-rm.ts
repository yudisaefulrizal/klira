import { GALAT } from '@klira/shared';

// ---- Tinjau perbaikan ----
/** Isi catatan menjadi baris teks "kunci: nilai" agar mudah dibandingkan peninjau; larik diringkas per butir. */
export function ringkasIsi(isi: unknown): string[] {
  if (isi === null || isi === undefined) return [];
  if (typeof isi !== 'object') return [String(isi)];
  const baris: string[] = [];
  for (const [kunci, nilai] of Object.entries(isi as Record<string, unknown>)) {
    if (Array.isArray(nilai)) {
      baris.push(`${kunci}:`);
      nilai.forEach((x, i) => baris.push(`  ${i + 1}. ${typeof x === 'object' && x ? Object.values(x as Record<string, unknown>).filter((v) => v !== null && v !== '').join(' · ') : String(x)}`));
    } else if (nilai !== null && nilai !== '') {
      baris.push(`${kunci}: ${typeof nilai === 'object' ? JSON.stringify(nilai) : String(nilai)}`);
    }
  }
  return baris;
}

/** Baris yang berubah antara isi sekarang dan usulan (untuk penanda di peninjauan). */
export function selisihBaris(sekarang: readonly string[], usulan: readonly string[]): { sekarang: { teks: string; beda: boolean }[]; usulan: { teks: string; beda: boolean }[] } {
  const a = new Set(sekarang);
  const b = new Set(usulan);
  return { sekarang: sekarang.map((teks) => ({ teks, beda: !b.has(teks) })), usulan: usulan.map((teks) => ({ teks, beda: !a.has(teks) })) };
}

// ---- Perbaiki catatan ----
export const alasanPerbaikanSah = (alasan: string): boolean => alasan.trim().length > 0;
export const galatAlasanPerbaikan = (alasan: string): string | null => (alasanPerbaikanSah(alasan) ? null : GALAT.alasanWajib);
