export type Penyimpanan = Pick<Storage, 'getItem' | 'setItem'>;

const kunci = (halaman: string) => `klira.tab.${halaman}`;

/** Tab terakhir yang dibuka di halaman ini (5.1h); null bila belum ada atau tidak lagi valid. */
export function bacaTabTerakhir<T extends string>(halaman: string, valid: readonly T[], simpanan?: Penyimpanan | null): T | null {
  try {
    const nilai = simpanan?.getItem(kunci(halaman));
    return valid.find((v) => v === nilai) ?? null;
  } catch {
    return null;
  }
}

export function simpanTabTerakhir(halaman: string, tab: string, simpanan?: Penyimpanan | null): void {
  try {
    simpanan?.setItem(kunci(halaman), tab);
  } catch {
    /* penyimpanan penuh atau ditolak: tab tidak diingat */
  }
}

/** Tab yang dipakai: dari alamat bila valid, kalau tidak yang terakhir diingat, kalau tidak yang pertama. */
export function pilihTab<T extends string>(daftar: readonly T[], dariAlamat: string | null, terakhir: T | null): T {
  return daftar.find((t) => t === dariAlamat) ?? terakhir ?? daftar[0];
}
