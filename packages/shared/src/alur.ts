import type { JenisKunjungan, StatusAntrean, TahapLayanan } from './status';

/** Aturan alur murni pendaftaran dan antrean (bagian 7), dipakai API dan web. */

export const AKSI_ANTREAN = ['panggil', 'mulai', 'selesai', 'batal'] as const;
export type AksiAntrean = (typeof AKSI_ANTREAN)[number];

/** Perpindahan status antrean: panggil ulang (dipanggil ke dipanggil) diizinkan untuk memanggil lagi. */
export const TRANSISI_ANTREAN: Record<AksiAntrean, { dari: readonly StatusAntrean[]; ke: StatusAntrean }> = {
  panggil: { dari: ['menunggu', 'dipanggil'], ke: 'dipanggil' },
  mulai: { dari: ['dipanggil'], ke: 'dilayani' },
  selesai: { dari: ['dilayani'], ke: 'selesai' },
  batal: { dari: ['menunggu', 'dipanggil'], ke: 'batal' },
};

export const bolehAksiAntrean = (status: StatusAntrean, aksi: AksiAntrean): boolean => TRANSISI_ANTREAN[aksi].dari.includes(status);
export const aksiAntreanTersedia = (status: StatusAntrean): AksiAntrean[] => AKSI_ANTREAN.filter((a) => bolehAksiAntrean(status, a));

export const AWALAN_ANTREAN = 'A';
/** Nomor antrean tampil, mis. 1 menjadi A-001. */
export const kodeAntrean = (nomor: number): string => `${AWALAN_ANTREAN}-${String(nomor).padStart(3, '0')}`;

/** Tahap tujuan yang sah dari tahap sekarang. Penutupan kunjungan (ditutup) memiliki peristiwa sendiri (7), bukan ubah tahap biasa. */
export const TAHAP_TUJUAN: Record<TahapLayanan, readonly TahapLayanan[]> = {
  menunggu_skrining: ['pemeriksaan'],
  pemeriksaan: ['resep', 'kasir'],
  resep: ['kasir'],
  kasir: [],
  ditutup: [],
};
export const bolehPindahTahap = (dari: TahapLayanan, ke: TahapLayanan): boolean => TAHAP_TUJUAN[dari].includes(ke);

/** Tahap kunjungan yang masih berjalan (belum ditutup). */
export const TAHAP_BERJALAN: readonly TahapLayanan[] = ['menunggu_skrining', 'pemeriksaan', 'resep', 'kasir'];

/** Rawat jalan wajib poli; rawat inap langsung tidak memakai poli dan antrean poli. */
export const jenisPakaiAntrean = (jenis: JenisKunjungan): boolean => jenis === 'AMB';

/** Nomor RM berurutan per fasyankes: 7 digit dikelompokkan 2-2-3, mis. 12345 menjadi 00-01-234 (dari 0012345). */
export function formatNomorRm(urutan: number): string {
  const d = String(urutan).padStart(7, '0');
  return `${d.slice(0, 2)}-${d.slice(2, 4)}-${d.slice(4)}`;
}

const WIB_MS = 7 * 60 * 60 * 1000;
/** Tanggal (YYYY-MM-DD) pada zona Asia/Jakarta (UTC+7) untuk batas hari antrean; waktu tetap disimpan UTC. */
export const tanggalWib = (waktu: Date): string => new Date(waktu.getTime() + WIB_MS).toISOString().slice(0, 10);

/** Batas waktu UTC untuk rentang tanggal WIB inklusif (YYYY-MM-DD): awal hari `dari` sampai sebelum hari sesudah `sampai`. */
export function rentangHariWib(dari?: string, sampai?: string): { awal?: Date; akhir?: Date } {
  const hari = (t: string) => new Date(`${t}T00:00:00.000Z`).getTime() - WIB_MS;
  return { ...(dari ? { awal: new Date(hari(dari)) } : {}), ...(sampai ? { akhir: new Date(hari(sampai) + 24 * 3_600_000) } : {}) };
}

/** Umur penuh dalam tahun dari tanggal lahir (YYYY-MM-DD) pada tanggal acuan. */
export function umurTahun(tanggalLahir: string, acuan: Date = new Date()): number {
  const [y, m, d] = tanggalLahir.split('-').map(Number);
  const a = new Date(acuan.getTime() + WIB_MS);
  let umur = a.getUTCFullYear() - y;
  if (a.getUTCMonth() + 1 < m || (a.getUTCMonth() + 1 === m && a.getUTCDate() < d)) umur -= 1;
  return Math.max(0, umur);
}
