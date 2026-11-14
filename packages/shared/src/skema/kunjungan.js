import { z } from 'zod';
import { REGISTRASI } from '../umum/teks.js';
import { AKSI_ANTREAN } from '../umum/alur.js';
import { idPositif, teksOpsional, teksWajib } from './umum.js';
export const NILAI_JENIS_KUNJUNGAN = ['AMB', 'IMP', 'LAB'];
export const NILAI_CARA_PEMBAYARAN = ['umum', 'jkn', 'asuransi'];
export const NILAI_TAHAP = ['menunggu_skrining', 'pemeriksaan', 'resep', 'kasir', 'ditutup'];
export const NILAI_STATUS_ANTREAN = ['menunggu', 'dipanggil', 'dilayani', 'selesai', 'batal'];
/** Pendaftaran kunjungan (3.3, MODAL-1): layanan, poli dan DPJP, cara pembayaran (nomor SEP boleh menyusul), keluhan singkat. */
export const kunjunganMasukan = z
    .object({
    pasien_id: idPositif,
    jenis: z.enum(NILAI_JENIS_KUNJUNGAN),
    jenis_poli: teksOpsional(60),
    dpjp_id: idPositif.nullish(),
    // Penunjang saja (LAB): pemeriksaan lab dipilih saat mendaftar, perujuk (dokter atau klinik pengirim) opsional.
    pemeriksaan_ids: z.array(idPositif).max(20).optional(),
    perujuk: teksOpsional(200),
    cara_pembayaran: z.enum(NILAI_CARA_PEMBAYARAN).default('umum'),
    nomor_sep: teksOpsional(50),
    keluhan_singkat: teksOpsional(500),
})
    .superRefine((d, ctx) => {
    if (d.jenis === 'AMB' && !d.jenis_poli?.trim())
        ctx.addIssue({ code: 'custom', path: ['jenis_poli'], message: REGISTRASI.galat.poliWajib });
    if (d.jenis === 'LAB' && !d.pemeriksaan_ids?.length)
        ctx.addIssue({ code: 'custom', path: ['pemeriksaan_ids'], message: REGISTRASI.galat.pemeriksaanWajib });
    if (d.cara_pembayaran !== 'jkn' && d.nomor_sep?.trim())
        ctx.addIssue({ code: 'custom', path: ['nomor_sep'], message: REGISTRASI.galat.sepHanyaJkn });
});
/** Penyerahan hasil lab kunjungan penunjang saja (di kasir). */
export const serahHasilMasukan = z.object({ penerima_nama: teksWajib(200), hubungan: teksOpsional(100) });
export const ubahTahapMasukan = z.object({ tahap: z.enum(NILAI_TAHAP) });
export const aksiAntrean = z.enum(AKSI_ANTREAN);
const kosongJadiTiada = (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v);
/** Filter daftar antrean: tanggal (zona Asia/Jakarta, bawaan hari ini), poli, status. */
export const filterAntrean = z.object({
    tanggal: z.preprocess(kosongJadiTiada, z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
    lokasi_id: z.preprocess(kosongJadiTiada, z.coerce.number().int().positive().optional()),
    status: z.preprocess(kosongJadiTiada, z.enum(NILAI_STATUS_ANTREAN).optional()),
    halaman: z.coerce.number().int().min(1).default(1),
    ukuran: z.coerce.number().int().min(1).max(100).default(50),
});
