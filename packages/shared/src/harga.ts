/** Rupiah bertitik ribuan untuk catatan audit dan teks; `-` bila kosong. */
export const rupiahTeks = (n: number | null | undefined): string => (n === null || n === undefined ? '-' : `Rp ${Math.trunc(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`);

/** Satu bidang harga: nama, nilai lama (null bila belum ada), dan nilai baru. */
export type PerubahanHarga = readonly [label: string, lama: number | null | undefined, baru: number | null | undefined];

/**
 * Ringkasan perubahan harga untuk audit ("harga umum Rp 25.000 → Rp 30.000; harga JKN - → Rp 20.000"); hanya bidang yang berubah.
 * Null bila tidak ada yang berubah. Harga lama tetap bisa dirunut di log audit karena tagihan menyimpan harganya sendiri.
 */
export function ringkasPerubahanHarga(bidang: readonly PerubahanHarga[]): string | null {
  const beda = bidang.filter(([, lama, baru]) => (lama ?? null) !== (baru ?? null));
  return beda.length ? beda.map(([label, lama, baru]) => `${label} ${rupiahTeks(lama)} → ${rupiahTeks(baru)}`).join('; ') : null;
}
