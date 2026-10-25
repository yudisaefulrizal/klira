/** Konstanta modul klinis (4.2, 4.8): bagian catatan, tanda vital dengan kode LOINC dan satuan UCUM, bidang pemeriksaan. */

/** Bagian pemeriksaan klinis; tiap bagian disahkan sendiri (satu pengesahan per bagian, entitas_id = id kunjungan). */
export const BAGIAN_KLINIS = ['anamnesis', 'tanda_vital', 'pemeriksaan', 'diagnosis', 'tindakan', 'tindak_lanjut'] as const;
export type BagianKlinis = (typeof BAGIAN_KLINIS)[number];

export type DefinisiTandaVital = { kunci: string; loinc: string; satuan: string; min: number; max: number };

/** Kode LOINC dan satuan UCUM tanda vital umum; batas hanya untuk menangkap salah ketik. */
export const TANDA_VITAL = [
  { kunci: 'sistolik', loinc: '8480-6', satuan: 'mm[Hg]', min: 30, max: 300 },
  { kunci: 'diastolik', loinc: '8462-4', satuan: 'mm[Hg]', min: 20, max: 200 },
  { kunci: 'nadi', loinc: '8867-4', satuan: '/min', min: 20, max: 250 },
  { kunci: 'suhu', loinc: '8310-5', satuan: 'Cel', min: 30, max: 45 },
  { kunci: 'respirasi', loinc: '9279-1', satuan: '/min', min: 5, max: 80 },
  { kunci: 'spo2', loinc: '59408-5', satuan: '%', min: 30, max: 100 },
  { kunci: 'berat_badan', loinc: '29463-7', satuan: 'kg', min: 0.2, max: 500 },
  { kunci: 'tinggi_badan', loinc: '8302-2', satuan: 'cm', min: 20, max: 250 },
] as const satisfies readonly DefinisiTandaVital[];
export type KunciTandaVital = (typeof TANDA_VITAL)[number]['kunci'];

export const PEMERIKSAAN_BIDANG = ['keadaan_umum', 'kepala_leher', 'thorax', 'abdomen', 'ekstremitas', 'catatan'] as const;
export type BidangPemeriksaan = (typeof PEMERIKSAAN_BIDANG)[number];

export const PERAN_DIAGNOSIS = ['utama', 'penyerta'] as const;
export type PeranDiagnosis = (typeof PERAN_DIAGNOSIS)[number];
export const JENIS_TINDAK_LANJUT = ['pulang', 'rujuk', 'rawat_inap'] as const;
export type JenisTindakLanjut = (typeof JENIS_TINDAK_LANJUT)[number];

export const SISTEM_TERMINOLOGI = ['icd10', 'icd9cm', 'loinc', 'snomed', 'ucum'] as const;
export type SistemTerminologi = (typeof SISTEM_TERMINOLOGI)[number];
export const JENIS_FAVORIT = ['diagnosis', 'tindakan', 'resep'] as const;
export type JenisFavorit = (typeof JENIS_FAVORIT)[number];
export const BAGIAN_TEMPLAT = ['anamnesis', 'pemeriksaan'] as const;
export type BagianTemplat = (typeof BAGIAN_TEMPLAT)[number];

/** Perbaikan oleh pembuat tanpa persetujuan hanya dalam 2x24 jam sejak pengesahan terakhir (bagian 7). */
export const BATAS_PERBAIKAN_JAM = 48;

/** Pembeda kode diagnosis ICD-10 (mis. I10, E11.9) dan tindakan ICD-9 CM (mis. 89.52). */
export const POLA_ICD10 = /^[A-Z]\d{2}(\.[0-9A-Z]{1,4})?$/;
export const POLA_ICD9CM = /^\d{2}(\.\d{1,2})?$/;
