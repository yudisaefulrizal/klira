import { z } from 'zod';
import { GALAT, GANTI_KREDENSIAL, IZIN } from '../umum/teks.js';
import { tipeIzinAkun } from './entitas.js';
import { konfirmasiPeringatan } from './akses.js';
import { alasan, idPositif, nik, tanggal, teksOpsional, teksWajib } from './umum.js';
export const STATUS_PENGGUNA = ['semua', 'aktif', 'nonaktif'];
const kosongJadiTiada = (v) => (v === '' ? undefined : v);
/** Filter daftar pengguna (query string): pencarian nama/username, status, jenis akun aktif + paginasi. */
export const filterPengguna = z.object({
    cari: z.preprocess(kosongJadiTiada, z.string().trim().max(100).optional()),
    status: z.preprocess(kosongJadiTiada, z.enum(STATUS_PENGGUNA).default('semua')),
    jenis_akun_id: z.preprocess(kosongJadiTiada, z.coerce.number().int().positive().optional()),
    halaman: z.coerce.number().int().min(1).default(1),
    ukuran: z.coerce.number().int().min(1).max(100).default(20),
});
/** Ubah pengguna: sekarang hanya nonaktifkan atau aktifkan kembali (tanpa hapus). */
export const ubahPengguna = z.object({ aktif: z.boolean() });
/** Pembuatan akun (3.3, 4.1, 4.1b): satu permintaan memuat akun, profil profesi, penugasan, dan izin per akun. */
export const dataAkun = z.object({
    nama: teksWajib(200),
    nik,
    username: z
        .string()
        .trim()
        .min(3, GANTI_KREDENSIAL.usernameFormat)
        .max(100, GANTI_KREDENSIAL.usernameFormat)
        .regex(/^[A-Za-z0-9._-]+$/, GANTI_KREDENSIAL.usernameFormat),
});
export const profilProfesiBaru = z.object({
    profesi: teksWajib(100),
    nomor_sip: teksOpsional(100),
    masa_berlaku_sip: tanggal.nullish(),
    ihs_practitioner_id: teksOpsional(100),
});
const periodeSah = (p) => !p.selesai || p.selesai >= p.mulai;
const galatPeriode = { path: ['selesai'], message: IZIN.selesaiSebelumMulai };
export const penugasanAkunBaru = z
    .object({ jenis_akun_id: idPositif, mulai: tanggal, selesai: tanggal.nullish() })
    .refine(periodeSah, galatPeriode);
export const izinAkunPembuatan = z
    .object({ izin_id: idPositif, tipe: tipeIzinAkun, alasan, mulai: tanggal, selesai: tanggal.nullish() })
    .refine(periodeSah, galatPeriode);
export const penggunaBaru = dataAkun.extend({
    profil: profilProfesiBaru.nullish(),
    penugasan: z.array(penugasanAkunBaru).min(1, GALAT.wajibDiisi).max(50),
    izin_akun: z.array(izinAkunPembuatan).max(200).default([]),
    konfirmasi_peringatan: konfirmasiPeringatan.optional(),
});
