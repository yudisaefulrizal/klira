/**
 * Default keadaan baik (rekam medis mengikuti formulir klinik, P6–P8): isian pemeriksaan yang punya keadaan normal sudah terisi teks keadaan baik,
 * sehingga tenaga kesehatan hanya mengubah yang tidak normal. Satu sumber untuk form, uji, dan data demo.
 *
 * Util di sini bersifat umum (dipakai ulang bagian lain, mis. pemeriksaan fisik dan anamnesis P7): bandingkan nilai dengan default,
 * hitung isian yang diubah, dan kembalikan sekelompok isian ke normal.
 */

/** Nilai default satu isian: teks, pilihan (teks enum), ya/tidak, atau null (normal = kosong). */
export type NilaiDefault = string | boolean | null;
/** Peta default per kunci isian; kunci tanpa default tidak ikut ditandai dan tidak diubah oleh "Semua normal". */
export type PetaDefault<K extends string = string> = Readonly<Partial<Record<K, NilaiDefault>>>;

/** Teks default "tidak ada" (alergi, riwayat pengobatan, obat yang dikonsumsi, ...). */
export const TEKS_TIDAK_ADA = 'tidak ada';

/** Normalisasi pembanding: teks tanpa beda huruf besar/kecil dan spasi berlebih; null/undefined sama dengan teks kosong. */
const normal = (v: unknown): unknown => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ').toLowerCase() : v === null || v === undefined ? '' : v);

/** Nilai dianggap sama dengan default (kunci tanpa default selalu dianggap sama). */
export const samaDenganDefault = (nilai: unknown, bawaan: NilaiDefault | undefined): boolean => bawaan === undefined || normal(nilai) === normal(bawaan);

/** Teks bermakna "tidak ada" (abaikan huruf besar/kecil dan spasi). */
export const berartiTidakAda = (teks: string | null | undefined): boolean => normal(teks) === TEKS_TIDAK_ADA;

/** Alergi untuk konteks pasien: kosong atau default "tidak ada" berarti tanpa alergi (null). */
export const alergiTercatat = (alergi: string | null | undefined): string | null => (!alergi?.trim() || berartiTidakAda(alergi) ? null : alergi.trim());

const kunciDefault = <K extends string>(bawaan: PetaDefault<K>, kunci?: readonly K[]): K[] =>
  (kunci ?? (Object.keys(bawaan) as K[])).filter((k) => bawaan[k] !== undefined);

/** Kunci isian yang nilainya berbeda dari default (dibatasi `kunci` bila diberikan, mis. satu kelompok). */
export function isianDiubah<T extends Record<string, unknown>, K extends keyof T & string>(nilai: T, bawaan: PetaDefault<K>, kunci?: readonly K[]): K[] {
  return kunciDefault(bawaan, kunci).filter((k) => !samaDenganDefault(nilai[k], bawaan[k]));
}

/** Jumlah isian yang berbeda dari default ("n isian diubah"). */
export const jumlahDiubah = <T extends Record<string, unknown>, K extends keyof T & string>(nilai: T, bawaan: PetaDefault<K>, kunci?: readonly K[]): number =>
  isianDiubah(nilai, bawaan, kunci).length;

/**
 * Kembalikan isian ke default ("Semua normal" untuk satu kelompok bila `kunci` diberikan, "Kembalikan semua ke normal" bila tidak).
 * Isian teks di form menerima default null sebagai teks kosong; isian tanpa default tidak disentuh.
 */
export function kembalikanNormal<T extends Record<string, unknown>, K extends keyof T & string>(nilai: T, bawaan: PetaDefault<K>, kunci?: readonly K[]): T {
  const hasil: Record<string, unknown> = { ...nilai };
  for (const k of kunciDefault(bawaan, kunci)) {
    const d = bawaan[k] as NilaiDefault;
    hasil[k] = d === null && typeof nilai[k] === 'string' ? '' : d;
  }
  return hasil as T;
}

/** Form baru (belum pernah disimpan dan tanpa draf): isian kosong diisi default keadaan baik. */
export const isiDefault = <T extends Record<string, unknown>, K extends keyof T & string>(kosong: T, bawaan: PetaDefault<K>): T => kembalikanNormal(kosong, bawaan);

// --- Skrining keperawatan (P6) ---

/** Default keadaan baik isian keperawatan; isian nyeri lain normal bila kosong (disimpan null saat tidak nyeri). */
export const DEFAULT_KEPERAWATAN = {
  kajian_keperawatan: 'keadaan umum baik',
  telah_diobati: TEKS_TIDAK_ADA,
  alergi: TEKS_TIDAK_ADA,
  obat_dikonsumsi: TEKS_TIDAK_ADA,
  nyeri_jenis: 'tidak',
  nyeri_skala: null,
  nyeri_lokasi: null,
  nyeri_durasi: null,
  nyeri_frekuensi: null,
  nyeri_hilang_bila: null,
  jatuh_tidak_seimbang: false,
  jatuh_menopang: false,
  gizi_bb_turun: false,
  gizi_asupan_kurang: false,
} as const;
export type KunciDefaultKeperawatan = keyof typeof DEFAULT_KEPERAWATAN;

export type HasilRisikoJatuh = 'tidak_berisiko' | 'risiko_rendah' | 'risiko_tinggi';
/** Get Up and Go: tidak ada "ya" = tidak berisiko, satu = risiko rendah, dua = risiko tinggi. Dihitung, tidak disimpan. */
export function hasilRisikoJatuh(d: { jatuh_tidak_seimbang: boolean; jatuh_menopang: boolean }): HasilRisikoJatuh {
  const ya = Number(d.jatuh_tidak_seimbang) + Number(d.jatuh_menopang);
  return ya === 0 ? 'tidak_berisiko' : ya === 1 ? 'risiko_rendah' : 'risiko_tinggi';
}

export type HasilRisikoGizi = 'tidak_berisiko' | 'berisiko';
/** Skrining gizi sederhana: ada "ya" = berisiko malnutrisi. Dihitung, tidak disimpan. */
export const hasilRisikoGizi = (d: { gizi_bb_turun: boolean; gizi_asupan_kurang: boolean }): HasilRisikoGizi =>
  d.gizi_bb_turun || d.gizi_asupan_kurang ? 'berisiko' : 'tidak_berisiko';
