import { z } from 'zod';
import { GALAT, REGISTRASI } from '../teks';
import type { Halaman } from '../tipe';
import type { JenisKunjungan, CaraPembayaran, StatusAntrean, StatusIdentitas, StatusKunjungan, TahapLayanan } from '../status';
import { jenisKelamin, waliKeluargaMasukan } from './entitas';
import { idPositif, nik, teksOpsional, teksWajib } from './umum';

export const JALUR_IDENTITAS = ['nik', 'paspor', 'kitas', 'tanpa_identitas'] as const;
export type JalurIdentitas = (typeof JALUR_IDENTITAS)[number];
export const BENTUK_PERSETUJUAN = ['tertulis', 'lisan'] as const;
export const PENANDATANGAN_PERSETUJUAN = ['pasien', 'wali'] as const;
export const NILAI_TAHAP_FILTER = ['semua', 'menunggu_skrining', 'pemeriksaan', 'resep', 'kasir', 'ditutup'] as const;
export type TahapFilter = (typeof NILAI_TAHAP_FILTER)[number];

const kosongJadiTiada = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? undefined : v);

/** Tanggal kalender YYYY-MM-DD yang sah dan bukan di masa depan (tanggal lahir boleh sebelum 2014). */
export const tanggalLahir = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, GALAT.tanggalLahir)
  .refine((t) => {
    const d = new Date(`${t}T00:00:00.000Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === t && d.getTime() <= Date.now() + 14 * 3_600_000;
  }, GALAT.tanggalLahir);

const nikOpsional = z.preprocess(kosongJadiTiada, nik.nullish());

/** Registrasi pasien baru (3.3): identitas, data sosial, alamat, jalur identitas khusus, wali, JKN, dan general consent dalam satu permintaan. */
export const registrasiPasienMasukan = z
  .object({
    jalur_identitas: z.enum(JALUR_IDENTITAS).default('nik'),
    nik: nikOpsional,
    nama: teksWajib(),
    ibu_kandung: teksOpsional(),
    tempat_lahir: teksOpsional(100),
    tanggal_lahir: tanggalLahir,
    jenis_kelamin: jenisKelamin,
    agama: teksOpsional(50),
    suku: teksOpsional(100),
    bahasa: teksOpsional(100),
    pekerjaan: teksOpsional(100),
    pendidikan: teksOpsional(100),
    status_kawin: teksOpsional(50),
    alamat: teksOpsional(1000),
    kode_wilayah: teksOpsional(20),
    nomor_paspor: teksOpsional(50),
    nomor_kitas: teksOpsional(50),
    jkn_nomor_kartu: teksOpsional(50),
    jkn_kelas_hak: teksOpsional(20),
    jkn_fktp_terdaftar: teksOpsional(200),
    tidak_cakap: z.boolean().default(false),
    wali: z.array(waliKeluargaMasukan).max(10).default([]),
    persetujuan: z.object({
      teks_persetujuan_id: idPositif,
      bentuk: z.enum(BENTUK_PERSETUJUAN),
      penandatangan: z.enum(PENANDATANGAN_PERSETUJUAN),
      /** Indeks wali pada `wali` bila penandatangan wali. */
      wali_ke: z.number().int().min(0).nullish(),
      setuju: z.literal(true, { error: REGISTRASI.galat.persetujuanWajib }),
    }),
    /** Pendaftar telah melihat kemungkinan data ganda dan tetap mendaftarkan sebagai pasien baru. */
    konfirmasi_duplikat: z.boolean().default(false),
  })
  .superRefine((d, ctx) => {
    const tambah = (path: string, pesan: string) => ctx.addIssue({ code: 'custom', path: path.split('.'), message: pesan });
    if (d.jalur_identitas === 'nik' && !d.nik) tambah('nik', REGISTRASI.galat.nikWajib);
    if (d.jalur_identitas === 'paspor' && !d.nomor_paspor?.trim()) tambah('nomor_paspor', GALAT.wajibDiisi);
    if (d.jalur_identitas === 'kitas' && !d.nomor_kitas?.trim()) tambah('nomor_kitas', GALAT.wajibDiisi);
    if (d.jalur_identitas === 'tanpa_identitas' && d.nik) tambah('nik', REGISTRASI.galat.nikHarusKosong);
    if (d.tidak_cakap && d.wali.length === 0) tambah('wali', REGISTRASI.galat.waliWajib);
    if (d.tidak_cakap && d.persetujuan.penandatangan !== 'wali') tambah('persetujuan.penandatangan', REGISTRASI.galat.penandatanganWali);
    if (d.persetujuan.penandatangan === 'wali' && (d.persetujuan.wali_ke == null || d.persetujuan.wali_ke >= d.wali.length)) {
      tambah('persetujuan.wali_ke', REGISTRASI.galat.waliPenandatangan);
    }
  });
export type RegistrasiPasienMasukan = z.infer<typeof registrasiPasienMasukan>;
export type RegistrasiPasienKirim = z.input<typeof registrasiPasienMasukan>;

/** Status identitas dari jalur: hanya pasien tanpa identitas yang sementara. */
export const statusIdentitasDari = (jalur: JalurIdentitas): StatusIdentitas => (jalur === 'tanpa_identitas' ? 'sementara' : 'lengkap');

export const cekDuplikatMasukan = z.object({
  nik: nikOpsional,
  nama: z.preprocess(kosongJadiTiada, z.string().trim().max(200).optional()),
  tanggal_lahir: z.preprocess(kosongJadiTiada, tanggalLahir.optional()),
  ibu_kandung: z.preprocess(kosongJadiTiada, z.string().trim().max(200).optional()),
});
export type CekDuplikatMasukan = z.infer<typeof cekDuplikatMasukan>;

export type AlasanDuplikat = 'nik' | 'nama_lahir_ibu';
export type KandidatDuplikatDto = { id: number; nomor_rm: string; nama: string; tanggal_lahir: string; alasan: AlasanDuplikat };

/** Filter Daftar pasien (query string): pencarian nama/nomor RM/NIK, tahap layanan, paginasi. */
export const filterPasien = z.object({
  cari: z.preprocess(kosongJadiTiada, z.string().trim().max(100).optional()),
  tahap: z.preprocess(kosongJadiTiada, z.enum(NILAI_TAHAP_FILTER).default('semua')),
  halaman: z.coerce.number().int().min(1).default(1),
  ukuran: z.coerce.number().int().min(1).max(100).default(20),
});
export type FilterPasien = z.infer<typeof filterPasien>;

export type AntreanRingkasDto = { id: number; kode: string; status: StatusAntrean };
export type KunjunganAktifDto = {
  id: number;
  jenis: JenisKunjungan;
  status: StatusKunjungan;
  tahap_layanan: TahapLayanan;
  cara_pembayaran: CaraPembayaran;
  poli_nama: string | null;
  dpjp_nama: string | null;
  mulai: string;
  antrean: AntreanRingkasDto | null;
};
/** Baris Daftar pasien: hanya data minimal (3.1), tanpa NIK, alamat, atau isi rekam medis. */
export type PasienBarisDto = {
  id: number;
  nomor_rm: string;
  nama: string;
  jenis_kelamin: 'laki_laki' | 'perempuan';
  umur_tahun: number;
  status_identitas: StatusIdentitas;
  kunjungan: KunjunganAktifDto | null;
};
export type DaftarPasienDto = Halaman<PasienBarisDto> & { jumlah_tahap: Record<Exclude<TahapFilter, 'semua'>, number> };

export type WaliDto = { id: number; hubungan: string; nama: string; kontak: string | null };
/** Isi data pasien; membukanya tercatat di audit (lihat). */
export type PasienDetailDto = {
  id: number;
  nomor_rm: string;
  nik: string | null;
  nama: string;
  ibu_kandung: string | null;
  tempat_lahir: string | null;
  tanggal_lahir: string;
  jenis_kelamin: 'laki_laki' | 'perempuan';
  agama: string | null;
  suku: string | null;
  bahasa: string | null;
  pekerjaan: string | null;
  pendidikan: string | null;
  status_kawin: string | null;
  alamat: string | null;
  kode_wilayah: string | null;
  nomor_paspor: string | null;
  nomor_kitas: string | null;
  jkn_nomor_kartu: string | null;
  jkn_kelas_hak: string | null;
  jkn_fktp_terdaftar: string | null;
  status_identitas: StatusIdentitas;
  jalur_identitas: JalurIdentitas;
  tidak_cakap: boolean;
  wali: WaliDto[];
};

export type PasienBaruDto = { id: number; nomor_rm: string; nama: string; status_identitas: StatusIdentitas };

export type TeksPersetujuanDto = { id: number; jenis: string; versi: number; judul: string; tujuan: string; isi: string };
