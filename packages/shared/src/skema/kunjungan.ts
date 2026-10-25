import { z } from 'zod';
import { REGISTRASI } from '../teks';
import type { CaraPembayaran, JenisKunjungan, StatusAntrean, StatusKunjungan, TahapLayanan } from '../status';
import { AKSI_ANTREAN } from '../alur';
import { idPositif, teksOpsional } from './umum';

export const NILAI_JENIS_KUNJUNGAN = ['AMB', 'IMP'] as const satisfies readonly JenisKunjungan[];
export const NILAI_CARA_PEMBAYARAN = ['umum', 'jkn'] as const satisfies readonly CaraPembayaran[];
export const NILAI_TAHAP = ['menunggu_skrining', 'pemeriksaan', 'resep', 'kasir', 'ditutup'] as const satisfies readonly TahapLayanan[];
export const NILAI_STATUS_ANTREAN = ['menunggu', 'dipanggil', 'dilayani', 'selesai', 'batal'] as const satisfies readonly StatusAntrean[];

/** Pendaftaran kunjungan (3.3, MODAL-1): layanan, poli dan DPJP, cara pembayaran (nomor SEP boleh menyusul), keluhan singkat. */
export const kunjunganMasukan = z
  .object({
    pasien_id: idPositif,
    jenis: z.enum(NILAI_JENIS_KUNJUNGAN),
    lokasi_id: idPositif.nullish(),
    dpjp_id: idPositif.nullish(),
    cara_pembayaran: z.enum(NILAI_CARA_PEMBAYARAN).default('umum'),
    nomor_sep: teksOpsional(50),
    keluhan_singkat: teksOpsional(500),
  })
  .superRefine((d, ctx) => {
    if (d.jenis === 'AMB' && !d.lokasi_id) ctx.addIssue({ code: 'custom', path: ['lokasi_id'], message: REGISTRASI.galat.poliWajib });
    if (d.cara_pembayaran !== 'jkn' && d.nomor_sep?.trim()) ctx.addIssue({ code: 'custom', path: ['nomor_sep'], message: REGISTRASI.galat.sepHanyaJkn });
  });
export type KunjunganMasukan = z.infer<typeof kunjunganMasukan>;
export type KunjunganKirim = z.input<typeof kunjunganMasukan>;

export const ubahTahapMasukan = z.object({ tahap: z.enum(NILAI_TAHAP) });
export type UbahTahapMasukan = z.infer<typeof ubahTahapMasukan>;

export const aksiAntrean = z.enum(AKSI_ANTREAN);

const kosongJadiTiada = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? undefined : v);
/** Filter daftar antrean: tanggal (zona Asia/Jakarta, bawaan hari ini), poli, status. */
export const filterAntrean = z.object({
  tanggal: z.preprocess(kosongJadiTiada, z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  lokasi_id: z.preprocess(kosongJadiTiada, z.coerce.number().int().positive().optional()),
  status: z.preprocess(kosongJadiTiada, z.enum(NILAI_STATUS_ANTREAN).optional()),
  halaman: z.coerce.number().int().min(1).default(1),
  ukuran: z.coerce.number().int().min(1).max(100).default(50),
});
export type FilterAntrean = z.infer<typeof filterAntrean>;

export type AntreanDto = {
  id: number;
  kunjungan_id: number;
  lokasi_id: number;
  poli_nama: string | null;
  tanggal: string;
  nomor: number;
  kode: string;
  status: StatusAntrean;
  waktu_daftar: string;
  waktu_panggil: string | null;
  pasien_nama: string;
  pasien_nomor_rm: string;
};

export type KunjunganDto = {
  id: number;
  pasien_id: number;
  jenis: JenisKunjungan;
  status: StatusKunjungan;
  tahap_layanan: TahapLayanan;
  cara_pembayaran: CaraPembayaran;
  nomor_sep: string | null;
  lokasi_id: number | null;
  dpjp_id: number | null;
  keluhan_singkat: string | null;
  mulai: string;
  antrean: { id: number; nomor: number; kode: string; status: StatusAntrean } | null;
};

export type OpsiPoliDto = { id: number; nama: string };
export type OpsiDpjpDto = { id: number; nama: string; profesi: string; poli_ids: number[] };
export type OpsiKunjunganDto = { poli: OpsiPoliDto[]; dpjp: OpsiDpjpDto[] };
