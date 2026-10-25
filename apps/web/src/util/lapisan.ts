/**
 * Tumpukan lapisan terbuka (modal, panel, konfirmasi). Hanya lapisan teratas yang menangani Tab dan Esc,
 * dan lapisan di bawahnya dinonaktifkan untuk keyboard dan pembaca layar (5.1e: tidak ada modal bertumpuk
 * kecuali konfirmasi singkat di atas modal).
 */
type Pendengar = () => void;

let tumpukan: string[] = [];
const pendengar = new Set<Pendengar>();
const beri = () => pendengar.forEach((p) => p());

export function masukLapisan(id: string): void {
  if (!tumpukan.includes(id)) tumpukan = [...tumpukan, id];
  beri();
}
export function keluarLapisan(id: string): void {
  tumpukan = tumpukan.filter((x) => x !== id);
  beri();
}
export const lapisanAtas = (): string | null => tumpukan[tumpukan.length - 1] ?? null;
export const adaLapisan = (): boolean => tumpukan.length > 0;
/** Murni: apakah lapisan `id` harus inert pada tumpukan tertentu. Lapisan yang belum terdaftar (render pertama) dianggap teratas. */
export const inertDalam = (daftar: readonly string[], id: string): boolean => daftar.includes(id) && daftar[daftar.length - 1] !== id;
export const adalahInert = (id: string): boolean => inertDalam(tumpukan, id);
export const adalahAtas = (id: string): boolean => lapisanAtas() === id;
export function langgananLapisan(p: Pendengar): () => void {
  pendengar.add(p);
  return () => void pendengar.delete(p);
}
/** Tanda tangan keadaan untuk useSyncExternalStore. */
export const potretLapisan = (): string => tumpukan.join('|');
export function setelUlangLapisan(): void {
  tumpukan = [];
  beri();
}

export type TargetPemulihan = 'pemicu' | 'pertamaAtas' | 'tidak';
/**
 * Murni: ke mana fokus dikembalikan saat sebuah lapisan keluar.
 * `lapisanPemicu` = id lapisan yang memuat pemicu (null bila di luar semua lapisan), `atasSetelah` = lapisan teratas sesudah keluar.
 */
export function pilihTargetPemulihan(pemicuAda: boolean, lapisanPemicu: string | null, atasSetelah: string | null): TargetPemulihan {
  if (!atasSetelah) return pemicuAda ? 'pemicu' : 'tidak';
  if (pemicuAda && lapisanPemicu === atasSetelah) return 'pemicu';
  return 'pertamaAtas';
}
