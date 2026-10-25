/** Aturan murni pelindungan data pribadi (PP 33/2026, UU 27/2022): batas 3x24 jam, tahap permintaan hak dan pemusnahan, butir perjanjian prosesor. */

export const BATAS_PDP_JAM = 72;
const JAM_MS = 3_600_000;

export const JENIS_HAK = ['akses', 'salinan', 'koreksi', 'hapus', 'batasi', 'ekspor', 'keberatan'] as const;
export type JenisHak = (typeof JENIS_HAK)[number];
export const SALURAN_HAK = ['langsung', 'surat', 'elektronik', 'telepon'] as const;
export const HUBUNGAN_PEMOHON = ['pasien', 'wali', 'kuasa'] as const;
export type StatusHak = 'diterima' | 'disetujui' | 'ditolak' | 'dilaksanakan' | 'selesai';

/** Batas waktu layanan hak, notifikasi insiden, dan penghentian pemrosesan: 3x24 jam sejak diterima atau diketahui. */
export const batasPdp = (mulai: Date): Date => new Date(mulai.getTime() + BATAS_PDP_JAM * JAM_MS);
export const sisaJamPdp = (batas: Date, sekarang: Date): number => Math.ceil((batas.getTime() - sekarang.getTime()) / JAM_MS);

export type TahapHak = 'keputusan' | 'pelaksanaan' | 'notifikasi';
/** Tahap proses berikutnya menurut status: keputusan, lalu pelaksanaan (hanya bila disetujui), lalu notifikasi ke pemohon (juga untuk yang ditolak). */
export function tahapHakBerikut(status: StatusHak): TahapHak | null {
  if (status === 'diterima') return 'keputusan';
  if (status === 'disetujui') return 'pelaksanaan';
  if (status === 'ditolak' || status === 'dilaksanakan') return 'notifikasi';
  return null;
}
/** Permintaan hak terlambat bila belum selesai (notifikasi terkirim) melewati batas 3x24 jam. */
export const hakTerlambat = (k: { status: StatusHak; batas_waktu: Date }, sekarang: Date): boolean => k.status !== 'selesai' && sekarang.getTime() > k.batas_waktu.getTime();

export const DASAR_DITOLAK_RETENSI = 'Rekam medis wajib disimpan 25 tahun (PMK 24/2022 P39).';

export const DASAR_PEMROSESAN = ['persetujuan', 'kewajiban_hukum', 'kepentingan_vital', 'pelayanan_publik', 'kepentingan_sah', 'kontrak'] as const;
export type DasarPemrosesan = (typeof DASAR_PEMROSESAN)[number];

export const DASAR_PEMUSNAHAN = ['retensi_habis', 'permintaan_hak', 'lainnya'] as const;
export type StatusMusnah = 'direncanakan' | 'diperintahkan' | 'dilaksanakan' | 'selesai';
export type TahapMusnah = 'perintah' | 'pelaksanaan' | 'berita_acara';
/** Pemusnahan berjalan berurutan: perintah ke prosesor lebih dulu (PP 33/2026 P84), lalu pelaksanaan, lalu berita acara. */
export function tahapMusnahBerikut(status: StatusMusnah): TahapMusnah | null {
  if (status === 'direncanakan') return 'perintah';
  if (status === 'diperintahkan') return 'pelaksanaan';
  if (status === 'dilaksanakan') return 'berita_acara';
  return null;
}

/** Butir perjanjian pengendali-prosesor (PP 33/2026 P14, 11 butir). */
export const BUTIR_PERJANJIAN = [
  'objek_jangka', 'sifat_tujuan', 'jenis_data', 'kategori_subjek', 'hak_kewajiban', 'perintah_tertulis', 'kerahasiaan', 'keamanan', 'audit', 'sub_prosesor', 'pengembalian_hapus',
] as const;
export type ButirPerjanjian = (typeof BUTIR_PERJANJIAN)[number];
export const butirKurang = (ada: readonly string[]): ButirPerjanjian[] => BUTIR_PERJANJIAN.filter((b) => !ada.includes(b));
