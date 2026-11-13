import { z } from 'zod';
/** Aksi audit terstandar (4.7 ditambah aksi akun/izin 2.2, 2.3, 5.1m). */
export const AKSI_AUDIT = [
    'masuk', 'masuk_gagal', 'keluar', 'ganti_kredensial', 'ganti_kredensial_gagal', 'izin_ditolak', 'peringatan_izin',
    'input', 'perbaikan', 'lihat', 'ekspor', 'pemusnahan',
];
export const aksiAudit = z.enum(AKSI_AUDIT);
const teksOpsionalKosong = (maks) => z.preprocess((v) => (v === '' ? undefined : v), z.string().trim().max(maks).optional());
const waktuOpsional = z.preprocess((v) => (v === '' ? undefined : v), z.coerce.date().optional());
const bidangFilter = {
    pengguna_id: z.preprocess((v) => (v === '' ? undefined : v), z.coerce.number().int().positive().optional()),
    aksi: z.preprocess((v) => (v === '' ? undefined : v), aksiAudit.optional()),
    entitas: teksOpsionalKosong(100),
    dari: waktuOpsional,
    sampai: waktuOpsional,
};
const rentangSah = (f) => !f.dari || !f.sampai || f.sampai >= f.dari;
const galatRentang = { path: ['sampai'], message: 'Waktu akhir tidak boleh sebelum waktu awal' };
/** Filter daftar log audit (query string): pengguna, aksi, entitas, rentang waktu (UTC) + paginasi. */
export const filterAudit = z
    .object({
    ...bidangFilter,
    halaman: z.coerce.number().int().min(1).default(1),
    ukuran: z.coerce.number().int().min(1).max(100).default(20),
})
    .refine(rentangSah, galatRentang);
/** Masukan ekspor CSV: filter yang sama tanpa paginasi. */
export const eksporAudit = z.object(bidangFilter).refine(rentangSah, galatRentang);
