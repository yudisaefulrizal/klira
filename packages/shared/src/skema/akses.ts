import { z } from 'zod';
import { IZIN } from '../teks';
import { JENIS_PERINGATAN } from '../izin';
import { aksiIzin, cakupanIzin, tipeIzinAkun } from './entitas';
import { alasan, idPositif, paginasi, tanggal, teksOpsional, teksWajib } from './umum';

/** Konfirmasi pimpinan atas peringatan izin (2.2): alasan wajib; opsi Terima untuk akun ini. */
export const konfirmasiPeringatan = z.object({
  alasan,
  terima_untuk_akun: z.boolean().default(false),
});
export type KonfirmasiPeringatan = z.infer<typeof konfirmasiPeringatan>;

const periodeSah = (p: { mulai: Date; selesai?: Date | null }) => !p.selesai || p.selesai >= p.mulai;
const galatPeriode = { path: ['selesai'], message: IZIN.selesaiSebelumMulai };

export const jenisAkunBaru = z.object({
  nama: teksWajib(150),
  syarat_profesi: teksOpsional(),
  izin_ids: z.array(idPositif).default([]),
  alasan_perubahan: teksOpsional(1000),
});

export const jenisAkunUbah = z
  .object({
    nama: teksWajib(150).optional(),
    syarat_profesi: teksOpsional(),
    izin_ids: z.array(idPositif).optional(),
    aktif: z.boolean().optional(),
    alasan_perubahan: alasan.max(1000),
  })
  .refine((d) => d.nama !== undefined || d.syarat_profesi !== undefined || d.izin_ids !== undefined || d.aktif !== undefined, {
    message: IZIN.perubahanKosong,
  });

export const penugasanBaru = z
  .object({
    jenis_akun_id: idPositif,
    mulai: tanggal,
    selesai: tanggal.nullish(),
    konfirmasi_peringatan: konfirmasiPeringatan.optional(),
  })
  .refine(periodeSah, galatPeriode);

export const akhiriPeriode = z.object({ selesai: tanggal });

export const izinAkunBaru = z
  .object({
    izin_id: idPositif,
    tipe: tipeIzinAkun,
    alasan,
    mulai: tanggal,
    selesai: tanggal.nullish(),
    konfirmasi_peringatan: konfirmasiPeringatan.optional(),
  })
  .refine(periodeSah, galatPeriode);

export const terimaPeringatan = z.object({
  pengguna_id: idPositif,
  jenis_peringatan: z.enum(JENIS_PERINGATAN),
  alasan,
});

const kosongJadiTak = (v: unknown) => (v === '' ? undefined : v);
const waktuOpsional = z.preprocess(kosongJadiTak, z.coerce.date().optional());

/** Filter daftar peringatan: pengguna (id atau cari nama/username), jenis, rentang waktu (UTC) + paginasi. */
export const filterPeringatan = paginasi
  .extend({
    pengguna_id: z.preprocess(kosongJadiTak, z.coerce.number().int().positive().optional()),
    jenis_peringatan: z.preprocess(kosongJadiTak, z.enum(JENIS_PERINGATAN).optional()),
    dari: waktuOpsional,
    sampai: waktuOpsional,
  })
  .refine((f) => !f.dari || !f.sampai || f.sampai >= f.dari, { path: ['sampai'], message: IZIN.rentangTerbalik });
export type FilterPeringatan = z.infer<typeof filterPeringatan>;

/** Baris daftar peringatan izin (2.2) untuk pimpinan dan auditor. */
export type PeringatanIzinDto = {
  id: number;
  pengguna_id: number;
  pengguna_nama: string | null;
  jenis_peringatan: string;
  alasan_pimpinan: string;
  sumber: string;
  diterima_untuk_akun: boolean;
  ditetapkan_oleh: number | null;
  ditetapkan_oleh_nama: string | null;
  waktu: string;
};

export const katalogIzinParam = z.object({ fitur: z.string().optional(), aksi: aksiIzin.optional(), cakupan: cakupanIzin.optional() });
export const idPenggunaParam = z.object({ id: z.coerce.number().int().positive() });
export const idAnakParam = z.object({ id: z.coerce.number().int().positive(), anakId: z.coerce.number().int().positive() });
