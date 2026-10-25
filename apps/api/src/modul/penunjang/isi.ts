/** Isi kanonik hasil penunjang untuk pengesahan dan addendum (murni, tanpa basis data). */
export type SumberIsiHasil = {
  order_id: number;
  nama: string;
  kode_loinc: string | null;
  nilai: string;
  satuan: string | null;
  rujukan_teks: string | null;
  interpretasi: string;
  catatan: string | null;
};

export const susunIsiHasil = (s: SumberIsiHasil): Record<string, unknown> => ({
  order_id: s.order_id, pemeriksaan: s.nama, kode_loinc: s.kode_loinc, nilai: s.nilai, satuan: s.satuan, rujukan: s.rujukan_teks, interpretasi: s.interpretasi, catatan: s.catatan,
});
