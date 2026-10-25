export type PenyimpananDraf = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> & Partial<Pick<Storage, 'key' | 'length'>>;
export type Draf<T> = { versi: number; disimpan: string; langkah: number; nilai: T };

const VERSI = 1;
export const AWALAN_DRAF = 'klira.draf.';
/** Masa berlaku bawaan draf (komputer klinik bersama). */
export const KEDALUWARSA_DRAF_MS = 30 * 60 * 1000;

/** Salinan nilai tanpa bidang sensitif (tingkat atas) agar tidak pernah masuk penyimpanan lokal. */
export function saringSensitif<T>(nilai: T, sensitif: readonly string[] = []): T {
  if (!sensitif.length || nilai === null || typeof nilai !== 'object') return nilai;
  return Object.fromEntries(Object.entries(nilai as Record<string, unknown>).filter(([k]) => !sensitif.includes(k))) as T;
}

/** Hapus semua draf `klira.draf.*` (saat keluar atau pengguna berganti). */
export function hapusSemuaDraf(simpanan?: PenyimpananDraf | null): void {
  try {
    if (!simpanan || simpanan.key === undefined || simpanan.length === undefined) return;
    const kunci: string[] = [];
    for (let i = 0; i < simpanan.length; i++) {
      const k = simpanan.key(i);
      if (k?.startsWith(AWALAN_DRAF)) kunci.push(k);
    }
    kunci.forEach((k) => simpanan.removeItem(k));
  } catch {
    /* diabaikan */
  }
}
/** Kunci draf per alur dan per pemilik akun, mis. `klira.draf.pembuatan-akun.12`. */
export const kunciDraf = (alur: string, pemilikId?: number | null): string => `${AWALAN_DRAF}${alur}${pemilikId != null ? `.${pemilikId}` : ''}`;

/** Draf tersimpan, atau null bila tidak ada, rusak, atau versinya berbeda. */
export function bacaDraf<T>(kunci: string, simpanan?: PenyimpananDraf | null, opsi: { kedaluwarsaMs?: number; sekarang?: () => Date } = {}): Draf<T> | null {
  try {
    const mentah = simpanan?.getItem(kunci);
    if (!mentah) return null;
    const d = JSON.parse(mentah) as Draf<T>;
    if (!(d && d.versi === VERSI && typeof d.langkah === 'number' && 'nilai' in d)) return null;
    const umur = (opsi.sekarang ?? (() => new Date()))().getTime() - Date.parse(d.disimpan);
    if (!(umur <= (opsi.kedaluwarsaMs ?? KEDALUWARSA_DRAF_MS))) {
      hapusDraf(kunci, simpanan);
      return null;
    }
    return d;
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

/**
 * Antarmuka penyimpan draf otomatis. Lokal untuk alur non-kesehatan (tanpa bidang sensitif); server untuk alur klinis,
 * karena data kesehatan tidak boleh berada di penyimpanan peramban komputer klinik bersama.
 */
export interface AdaptorDraf<T> {
  /** Draf tersimpan (sinkron untuk lokal, asinkron untuk server); null bila tidak ada. */
  baca(): Draf<T> | null | Promise<Draf<T> | null>;
  simpan(nilai: T, langkah: number): void | Promise<unknown>;
  hapus(): void | Promise<unknown>;
  /** Bagian nilai yang boleh disimpan (lokal membuang bidang sensitif; server menyimpan semuanya). */
  saring(nilai: T): T;
}

/** Penyimpan di penyimpanan lokal peramban: hanya untuk alur tanpa data kesehatan. */
export function adaptorLokal<T>(kunci: string, opsi: { simpanan?: PenyimpananDraf | null; sensitif?: readonly string[]; kedaluwarsaMs?: number } = {}): AdaptorDraf<T> {
  const simpanan = 'simpanan' in opsi ? opsi.simpanan : typeof localStorage === 'undefined' ? null : localStorage;
  return {
    baca: () => bacaDraf<T>(kunci, simpanan, { kedaluwarsaMs: opsi.kedaluwarsaMs }),
    simpan: (nilai, langkah) => void simpanDraf(kunci, saringSensitif(nilai, opsi.sensitif), langkah, simpanan),
    hapus: () => hapusDraf(kunci, simpanan),
    saring: (nilai) => saringSensitif(nilai, opsi.sensitif),
  };
}

/** Awalan kunci draf lokal lama alur klinis (sebelum draf pindah ke server). */
export const AWALAN_DRAF_KLINIS_LAMA = [`${AWALAN_DRAF}pemeriksaan-klinis`, `${AWALAN_DRAF}skrining`] as const;
/** Buang sisa draf klinis dari penyimpanan lokal (hanya menghapus, tidak pernah menulis). */
export function hapusDrafKlinisLama(simpanan: PenyimpananDraf | null = typeof localStorage === 'undefined' ? null : localStorage): void {
  try {
    if (!simpanan || simpanan.key === undefined || simpanan.length === undefined) return;
    const kunci: string[] = [];
    for (let i = 0; i < simpanan.length; i++) {
      const k = simpanan.key(i);
      if (k && AWALAN_DRAF_KLINIS_LAMA.some((a) => k.startsWith(a))) kunci.push(k);
    }
    kunci.forEach((k) => simpanan.removeItem(k));
  } catch {
    /* diabaikan */
  }
}

/** Isian berubah dari keadaan awal? Dasar perlindungan tutup tak sengaja. */
export const adaPerubahan = (awal: unknown, kini: unknown): boolean => JSON.stringify(awal) !== JSON.stringify(kini);
