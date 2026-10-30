import { bayarMasukan, bukaShiftMasukan, KASIR, tutupShiftMasukan } from '@klira/shared';
import type { KasirKunjunganDto, MetodeBayar } from '@klira/shared';

type Isu = { path: PropertyKey[]; message: string };
const petakan = (isu: readonly Isu[]): Record<string, string> => {
  const g: Record<string, string> = {};
  for (const i of isu) g[i.path.map(String).join('.') || ''] ??= i.message;
  return g;
};

// ---- Pembayaran ----
export type KeadaanBayar = { metode: MetodeBayar; jumlah: string };
export const awalBayar = (sisa = 0): KeadaanBayar => ({ metode: 'tunai', jumlah: sisa > 0 ? String(sisa) : '' });
export const galatBayar = (k: KeadaanBayar): Record<string, string> => petakan(bayarMasukan.safeParse(k).error?.issues ?? []);
export const bentukBayar = (k: KeadaanBayar): Record<string, unknown> => ({ metode: k.metode, jumlah: k.jumlah });
/** Kembalian dari jumlah yang diterima terhadap sisa tagihan (0 bila belum cukup atau isian tidak sah). */
export function kembalian(k: KeadaanBayar, sisa: number): number {
  const j = Number(k.jumlah);
  return Number.isInteger(j) && j > sisa ? j - sisa : 0;
}
/** Jumlah yang akan diterapkan ke tagihan (dibatasi sisa). */
export function diterapkan(k: KeadaanBayar, sisa: number): number {
  const j = Number(k.jumlah);
  return Number.isInteger(j) && j > 0 ? Math.min(j, sisa) : 0;
}

// ---- Syarat tutup ----
/** Daftar syarat tutup kunjungan dari gambaran kasir; `lunas` bukan penghalang (butuh alasan), sisanya wajib. */
export function daftarSyarat(g: KasirKunjunganDto): { kunci: 'tahap' | 'tagihan' | 'resep' | 'lunas'; ok: boolean; wajib: boolean }[] {
  return [
    { kunci: 'tahap', ok: g.syarat.tahap_kasir, wajib: true },
    { kunci: 'tagihan', ok: g.syarat.tagihan_lengkap, wajib: true },
    { kunci: 'resep', ok: g.syarat.resep_diserahkan, wajib: true },
    { kunci: 'lunas', ok: g.syarat.lunas, wajib: false },
  ];
}
export const bisaTutup = (g: KasirKunjunganDto, alasan: string): boolean =>
  daftarSyarat(g).every((s) => s.ok || !s.wajib) && (g.syarat.lunas || alasan.trim().length > 0);

// ---- Shift ----
export type KeadaanShift = { kas: string; alasan: string };
export const awalShift = (): KeadaanShift => ({ kas: '', alasan: '' });
export function galatBukaShift(k: KeadaanShift): Record<string, string> {
  return Object.fromEntries(Object.entries(petakan(bukaShiftMasukan.safeParse({ kas_awal: k.kas }).error?.issues ?? [])).map(([a, b]) => [a === 'kas_awal' ? 'kas' : a, b]));
}
export function galatTutupShift(k: KeadaanShift, seharusnya: number): Record<string, string> {
  const g = Object.fromEntries(Object.entries(petakan(tutupShiftMasukan.safeParse({ kas_akhir: k.kas, alasan_selisih: k.alasan }).error?.issues ?? [])).map(([a, b]) => [a === 'kas_akhir' ? 'kas' : a === 'alasan_selisih' ? 'alasan' : a, b]));
  if (!g.kas && Number(k.kas) !== seharusnya && !k.alasan.trim()) g.alasan = KASIR.galat.alasanWajib;
  return g;
}
export const selisihShift = (k: KeadaanShift, seharusnya: number): number | null => (k.kas.trim() !== '' && Number.isInteger(Number(k.kas)) ? Number(k.kas) - seharusnya : null);
