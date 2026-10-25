import { z } from 'zod';
import { KEAMANAN } from '../teks';
import { paginasi } from './umum';

/** Batas dan nilai bawaan pengaturan keamanan (4.9); bawaan dipakai bila fasyankes belum menyimpan pengaturan. */
export const BATAS_KEAMANAN = {
  masaSesiJam: { min: 1, maks: 72, bawaan: 12 },
  batasPercobaanMasuk: { min: 3, maks: 20, bawaan: 5 },
  panjangMinimumKataSandi: { min: 8, maks: 64, bawaan: 8 },
} as const;

const bulat = (b: { min: number; maks: number }, pesan: string) => z.number({ error: pesan }).int(pesan).min(b.min, pesan).max(b.maks, pesan);

export const pengaturanKeamananMasukan = z.object({
  masa_sesi_jam: bulat(BATAS_KEAMANAN.masaSesiJam, KEAMANAN.galatMasaSesi),
  batas_percobaan_masuk: bulat(BATAS_KEAMANAN.batasPercobaanMasuk, KEAMANAN.galatBatasPercobaan),
  panjang_minimum_kata_sandi: bulat(BATAS_KEAMANAN.panjangMinimumKataSandi, KEAMANAN.galatPanjangKataSandi),
});
export type PengaturanKeamananMasukan = z.infer<typeof pengaturanKeamananMasukan>;

export type PengaturanKeamananDto = PengaturanKeamananMasukan & {
  /** true bila nilai berasal dari bawaan (belum pernah disimpan). */
  bawaan: boolean;
  diubah_pada: string | null;
};

/** Pengaturan efektif: nilai tersimpan, atau bawaan aman bila kosong atau di luar batas. */
export function pengaturanKeamananEfektif(baris: Partial<PengaturanKeamananMasukan> | null | undefined): PengaturanKeamananMasukan {
  const ambil = (nilai: number | undefined, b: { min: number; maks: number; bawaan: number }) =>
    typeof nilai === 'number' && Number.isInteger(nilai) && nilai >= b.min && nilai <= b.maks ? nilai : b.bawaan;
  return {
    masa_sesi_jam: ambil(baris?.masa_sesi_jam, BATAS_KEAMANAN.masaSesiJam),
    batas_percobaan_masuk: ambil(baris?.batas_percobaan_masuk, BATAS_KEAMANAN.batasPercobaanMasuk),
    panjang_minimum_kata_sandi: ambil(baris?.panjang_minimum_kata_sandi, BATAS_KEAMANAN.panjangMinimumKataSandi),
  };
}

export const STATUS_BACKUP_NILAI = ['berhasil', 'gagal', 'berjalan'] as const;
export type StatusBackup = (typeof STATUS_BACKUP_NILAI)[number];

export const filterRiwayatBackup = paginasi.pick({ halaman: true, ukuran: true });

export type RiwayatBackupDto = {
  id: number;
  waktu: string;
  status: string;
  ukuran_byte: number | null;
  lokasi: string | null;
};

/** Ukuran berkas terbaca (basis 1024), mis. 1,5 MB; null menjadi tanda hubung. */
export function formatUkuranByte(byte: number | null | undefined): string {
  if (byte === null || byte === undefined || !Number.isFinite(byte) || byte < 0) return '-';
  const satuan = ['B', 'KB', 'MB', 'GB', 'TB'];
  let nilai = byte;
  let i = 0;
  while (nilai >= 1024 && i < satuan.length - 1) {
    nilai /= 1024;
    i += 1;
  }
  const teks = i === 0 ? String(Math.round(nilai)) : nilai.toFixed(1).replace('.', ',');
  return `${teks} ${satuan[i]}`;
}
