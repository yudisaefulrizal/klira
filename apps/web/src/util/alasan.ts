/** Alasan siap dikirim: wajib berisi bukan spasi saja; opsional selalu siap. */
export const alasanSiap = (teks: string, wajib: boolean): boolean => !wajib || teks.trim().length > 0;
