import { KELOMPOK_MASTER } from './lokasi-master';
import { halamanMenuDiizinkan, punyaIzin } from '@klira/shared';
import type { PenggunaSaya } from '@klira/shared';

export const RUTE_MASUK = '/masuk';
export const RUTE_GANTI_KREDENSIAL = '/ganti-kredensial';

export type KeputusanRute = { tipe: 'tampil' } | { tipe: 'alihkan'; ke: string };

/** Halaman yang boleh dibuka akun ini (5.1m: yang tak diizinkan tidak ditampilkan). */
export function halamanDiizinkan(pengguna: PenggunaSaya): string[] {
  return [...new Set([pengguna.halaman_awal, ...halamanMenuDiizinkan(pengguna.fitur).map((h) => h.path), ...(punyaIzin(pengguna, 'master', 'lihat') ? KELOMPOK_MASTER.map(k => k.path) : [])])];
}

/**
 * Penjaga rute: belum masuk -> /masuk; wajib ganti kredensial -> /ganti-kredensial (semua halaman lain); sudah masuk -> halaman awal sesuai jenis akun
 * (dari /masuk, dari alamat tak dikenal, atau halaman yang tidak diizinkan).
 */
export function putuskanRute(path: string, pengguna: PenggunaSaya | null): KeputusanRute {
  if (path === '/' || /^\/klinik\/[a-z0-9-]+\/?$/.test(path)) return { tipe: 'tampil' };
  if (!pengguna) return path === RUTE_MASUK ? { tipe: 'tampil' } : { tipe: 'alihkan', ke: RUTE_MASUK };
  // Selama wajib ganti kredensial (2.4), hanya layar Ganti kredensial yang bisa dibuka.
  if (pengguna.wajib_ganti_kredensial) {
    return path === RUTE_GANTI_KREDENSIAL ? { tipe: 'tampil' } : { tipe: 'alihkan', ke: RUTE_GANTI_KREDENSIAL };
  }
  return halamanDiizinkan(pengguna).includes(path) ? { tipe: 'tampil' } : { tipe: 'alihkan', ke: pengguna.halaman_awal };
}
