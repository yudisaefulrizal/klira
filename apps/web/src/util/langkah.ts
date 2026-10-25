/** Logika murni MODAL-BERTAHAP (3.2): posisi, perpindahan, dan penanda langkah. */
export type StatusLangkah = 'selesai' | 'aktif' | 'belum';

export const batasi = (indeks: number, jumlah: number): number => Math.max(0, Math.min(jumlah - 1, Math.trunc(indeks) || 0));
export const langkahBerikut = (indeks: number, jumlah: number): number => batasi(indeks + 1, jumlah);
export const langkahSebelum = (indeks: number, jumlah: number): number => batasi(indeks - 1, jumlah);
export const adalahTerakhir = (indeks: number, jumlah: number): boolean => jumlah > 0 && indeks >= jumlah - 1;
export const adalahPertama = (indeks: number): boolean => indeks <= 0;
/** Posisi tampilan "2 dari 4" (indeks mulai dari 0). */
export const posisiLangkah = (indeks: number, jumlah: number): { nomor: number; dari: number } => ({ nomor: batasi(indeks, jumlah) + 1, dari: jumlah });

/** Penanda tiap langkah: yang sudah dinyatakan selesai, yang aktif, atau belum (daftar bisa diklik untuk semuanya). */
export function statusLangkah(indeks: number, jumlah: number, selesai: readonly boolean[]): StatusLangkah[] {
  return Array.from({ length: jumlah }, (_, i): StatusLangkah => (i === indeks ? 'aktif' : selesai[i] ? 'selesai' : 'belum'));
}

/** Langkah pertama yang belum valid (untuk mengarahkan pengguna saat kirim); -1 bila semua valid. */
export function langkahBermasalah(galatPerLangkah: readonly (string | null | undefined)[]): number {
  return galatPerLangkah.findIndex((g) => !!g);
}
