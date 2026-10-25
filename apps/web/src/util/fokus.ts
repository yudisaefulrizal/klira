/** Selektor elemen yang dapat difokuskan di dalam dialog. */
export const SELEKTOR_FOKUS =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Indeks fokus berikutnya dalam dialog dengan Tab (atau Shift+Tab) yang berputar di dalam daftar.
 * `aktif` -1 berarti fokus di luar daftar: masuk ke elemen pertama atau terakhir.
 */
export function fokusBerikut(jumlah: number, aktif: number, mundur: boolean): number {
  if (jumlah <= 0) return -1;
  if (aktif < 0) return mundur ? jumlah - 1 : 0;
  return mundur ? (aktif - 1 + jumlah) % jumlah : (aktif + 1) % jumlah;
}
