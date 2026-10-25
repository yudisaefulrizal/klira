export type PenyimpananDraf = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export type Draf<T> = { versi: number; disimpan: string; langkah: number; nilai: T };

const VERSI = 1;
/** Kunci draf per alur dan per pemilik akun, mis. `klira.draf.pembuatan-akun.12`. */
export const kunciDraf = (alur: string, pemilikId?: number | null): string => `klira.draf.${alur}${pemilikId != null ? `.${pemilikId}` : ''}`;

/** Draf tersimpan, atau null bila tidak ada, rusak, atau versinya berbeda. */
export function bacaDraf<T>(kunci: string, simpanan?: PenyimpananDraf | null): Draf<T> | null {
  try {
    const mentah = simpanan?.getItem(kunci);
    if (!mentah) return null;
    const d = JSON.parse(mentah) as Draf<T>;
    return d && d.versi === VERSI && typeof d.langkah === 'number' && 'nilai' in d ? d : null;
  } catch {
    return null;
  }
}

export function simpanDraf<T>(kunci: string, nilai: T, langkah: number, simpanan?: PenyimpananDraf | null, sekarang: () => Date = () => new Date()): boolean {
  try {
    simpanan?.setItem(kunci, JSON.stringify({ versi: VERSI, disimpan: sekarang().toISOString(), langkah, nilai } satisfies Draf<T>));
    return !!simpanan;
  } catch {
    return false; // penyimpanan penuh atau ditolak: isian tetap di layar
  }
}

export function hapusDraf(kunci: string, simpanan?: PenyimpananDraf | null): void {
  try {
    simpanan?.removeItem(kunci);
  } catch {
    /* diabaikan */
  }
}

/** Isian berubah dari keadaan awal? Dasar perlindungan tutup tak sengaja. */
export const adaPerubahan = (awal: unknown, kini: unknown): boolean => JSON.stringify(awal) !== JSON.stringify(kini);
