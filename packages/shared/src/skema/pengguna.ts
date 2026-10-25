import { z } from 'zod';

export const STATUS_PENGGUNA = ['semua', 'aktif', 'nonaktif'] as const;
export type StatusPengguna = (typeof STATUS_PENGGUNA)[number];

const kosongJadiTiada = (v: unknown) => (v === '' ? undefined : v);

/** Filter daftar pengguna (query string): pencarian nama/username, status, jenis akun aktif + paginasi. */
export const filterPengguna = z.object({
  cari: z.preprocess(kosongJadiTiada, z.string().trim().max(100).optional()),
  status: z.preprocess(kosongJadiTiada, z.enum(STATUS_PENGGUNA).default('semua')),
  jenis_akun_id: z.preprocess(kosongJadiTiada, z.coerce.number().int().positive().optional()),
  halaman: z.coerce.number().int().min(1).default(1),
  ukuran: z.coerce.number().int().min(1).max(100).default(20),
});
export type FilterPengguna = z.infer<typeof filterPengguna>;

/** Ubah pengguna: sekarang hanya nonaktifkan atau aktifkan kembali (tanpa hapus). */
export const ubahPengguna = z.object({ aktif: z.boolean() });
export type UbahPengguna = z.infer<typeof ubahPengguna>;

export type PenggunaDaftarDto = {
  id: number;
  nama: string;
  username: string;
  aktif: boolean;
  jenis_akun_aktif: string[];
  jumlah_izin_tambahan: number;
  jumlah_peringatan_terbuka: number;
};
