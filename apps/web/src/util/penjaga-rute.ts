import type { PenggunaSaya } from '@klira/shared';

export const RUTE_MASUK = '/masuk';

export type KeputusanRute = { tipe: 'tampil' } | { tipe: 'alihkan'; ke: string };

/** Halaman yang boleh dibuka akun ini (5.1m: yang tak diizinkan tidak ditampilkan). */
export function halamanDiizinkan(pengguna: PenggunaSaya): string[] {
  return [pengguna.halaman_awal];
}

/**
 * Penjaga rute: belum masuk -> /masuk; sudah masuk -> halaman awal sesuai jenis akun
 * (dari /masuk, dari alamat tak dikenal, atau halaman yang tidak diizinkan).
 */
export function putuskanRute(path: string, pengguna: PenggunaSaya | null): KeputusanRute {
  if (!pengguna) return path === RUTE_MASUK ? { tipe: 'tampil' } : { tipe: 'alihkan', ke: RUTE_MASUK };
  return halamanDiizinkan(pengguna).includes(path) ? { tipe: 'tampil' } : { tipe: 'alihkan', ke: pengguna.halaman_awal };
}
