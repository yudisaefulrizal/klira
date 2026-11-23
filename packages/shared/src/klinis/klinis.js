/** Konstanta modul klinis (4.2, 4.8): bagian catatan, tanda vital dengan kode LOINC dan satuan UCUM, bidang pemeriksaan. */
/** Bagian pemeriksaan klinis; tiap bagian disahkan sendiri (satu pengesahan per bagian, entitas_id = id kunjungan). */
export const BAGIAN_KLINIS = ['anamnesis', 'tanda_vital', 'keperawatan', 'pemeriksaan', 'diagnosis', 'tindakan', 'tindak_lanjut', 'diagnosis_banding', 'kie', 'obat_poli', 'evaluasi', 'subjek', 'objek', 'asesmen', 'plan', 'instruksi'];
/** Kode LOINC dan satuan UCUM tanda vital umum; batas hanya untuk menangkap salah ketik. */
export const TANDA_VITAL = [
    { kunci: 'tinggi_badan', loinc: '8302-2', satuan: 'cm', min: 20, max: 250 },
    { kunci: 'berat_badan', loinc: '29463-7', satuan: 'kg', min: 0.2, max: 500 },
    { kunci: 'lingkar_perut', loinc: '56115-9', satuan: 'cm', min: 20, max: 250 },
    { kunci: 'sistolik', loinc: '8480-6', satuan: 'mm[Hg]', min: 30, max: 300 },
    { kunci: 'diastolik', loinc: '8462-4', satuan: 'mm[Hg]', min: 20, max: 200 },
    { kunci: 'respirasi', loinc: '9279-1', satuan: '/min', min: 5, max: 80 },
    { kunci: 'nadi', loinc: '8867-4', satuan: '/min', min: 20, max: 250 },
    { kunci: 'suhu', loinc: '8310-5', satuan: 'Cel', min: 30, max: 45 },
    { kunci: 'spo2', loinc: '59408-5', satuan: '%', min: 30, max: 100 },
    { kunci: 'gcs', loinc: '9269-2', satuan: '{score}', min: 3, max: 15 },
];
/** Tingkat kesadaran (pilihan, bukan angka) dan kode LOINC-nya; disimpan bersama tanda vital. */
export const KESADARAN = ['compos_mentis', 'apatis', 'somnolen', 'sopor', 'koma'];
export const LOINC_KESADARAN = '67775-7';
/** Nomor dokumen catatan kunjungan: urutan kunjungan dalam klinik, tujuh digit berawalan D (mis. D0000003). */
export const nomorDokumen = (urutan) => `D${String(urutan).padStart(7, '0')}`;
/** Skrining nyeri keperawatan (P6): `tidak` menyembunyikan isian nyeri lain. */
export const JENIS_NYERI = ['tidak', 'akut', 'kronis'];
export const SKALA_NYERI_MAKS = 10;
/** Skrining visual (warna triase sederhana); arti warna mengikuti ketentuan klinik. */
export const SKRINING_VISUAL = ['hijau', 'kuning', 'merah'];
// Bidang pemeriksaan fisik terstruktur (P7): PEMERIKSAAN_BIDANG, definisi, kelompok, dan default di default-klinis.ts.
export const PERAN_DIAGNOSIS = ['utama', 'penyerta'];
export const JENIS_TINDAK_LANJUT = ['pulang', 'rujuk', 'rawat_inap'];
export const SISTEM_TERMINOLOGI = ['icd10', 'icd9cm', 'loinc', 'snomed', 'ucum'];
export const JENIS_FAVORIT = ['diagnosis', 'tindakan', 'resep'];
export const BAGIAN_TEMPLAT = ['anamnesis', 'pemeriksaan'];
/** Perbaikan oleh pembuat tanpa persetujuan hanya dalam 2x24 jam sejak pengesahan terakhir (bagian 7). */
export const BATAS_PERBAIKAN_JAM = 48;
/** Pembeda kode diagnosis ICD-10 (mis. I10, E11.9) dan tindakan ICD-9 CM (mis. 89.52). */
export const POLA_ICD10 = /^[A-Z]\d{2}(\.[0-9A-Z]{1,4})?$/;
export const POLA_ICD9CM = /^\d{2}(\.\d{1,2})?$/;
/**
 * Bagian narasi (teks bebas) yang melengkapi data klinis terstruktur, mengikuti formulir klinik (P7):
 * diagnosa banding dan KIE di Kesimpulan, obat yang diberikan di poli di Terapi. Bukan syarat penyelesaian,
 * dan diagnosa banding tidak ikut pengkodean, klaim, statistik, maupun diagnosis aktif. Evaluasi adalah huruf E pada catatan SOAPIE
 * di halaman Pasien (hasil atau respons pasien terhadap terapi dan tindakan).
 */
export const BAGIAN_NARASI = ['diagnosis_banding', 'kie', 'obat_poli', 'evaluasi', 'subjek', 'objek', 'asesmen', 'plan', 'instruksi'];
/** Catatan SOAPIE di halaman Pasien: enam teks panjang (Subjek, Objek, Asesmen, Plan, Instruksi, Evaluasi), terpisah dari bagian terstruktur modal Pemeriksaan klinis. */
export const BAGIAN_SOAPIE = ['subjek', 'objek', 'asesmen', 'plan', 'instruksi', 'evaluasi'];
export const LABEL_NARASI = {
    diagnosis_banding: 'Diagnosa banding', kie: 'Komunikasi, informasi, dan edukasi', obat_poli: 'Obat yang diberikan di poli', evaluasi: 'Evaluasi',
    subjek: 'Subjek', objek: 'Objek', asesmen: 'Asesmen', plan: 'Plan', instruksi: 'Instruksi',
};
/** Panjang maksimal isi narasi per bagian. */
export const MAKS_NARASI = { diagnosis_banding: 1000, kie: 2000, obat_poli: 1000, evaluasi: 5000, subjek: 5000, objek: 5000, asesmen: 5000, plan: 5000, instruksi: 5000 };
