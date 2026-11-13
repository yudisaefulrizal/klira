/** Alasan siap dikirim: wajib berisi bukan spasi saja; opsional selalu siap. */
export const alasanSiap = (teks, wajib) => !wajib || teks.trim().length > 0;
