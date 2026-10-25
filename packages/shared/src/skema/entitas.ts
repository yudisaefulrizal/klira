import { z } from 'zod';
import { AKSI_IZIN, CAKUPAN_IZIN } from '../izin';
import { alasan, idPositif, jejak, nik, tanggal, teksOpsional, teksWajib } from './umum';

export const jenisFasyankes = z.enum(['klinik_pratama_rawat_jalan', 'klinik_pratama_rawat_inap']);
export const environmentSatusehat = z.enum(['sandbox', 'produksi']);
export const jenisLokasi = z.enum(['poli', 'ruang', 'bed']);
export const statusOperasional = z.enum(['U', 'O']);
export const jenisKelamin = z.enum(['laki_laki', 'perempuan']);
export const aksiIzin = z.enum(AKSI_IZIN);
export const cakupanIzin = z.enum(CAKUPAN_IZIN);
export const tipeIzinAkun = z.enum(['tambah', 'kurang']);

const id = z.object({ id: idPositif });

// Fasyankes
export const fasyankesMasukan = z.object({
  nama: teksWajib(),
  jenis: jenisFasyankes,
  bentuk_usaha: teksOpsional(100),
  kode_registrasi: teksOpsional(50),
  organization_id: teksOpsional(100),
  status_akreditasi: teksOpsional(100),
  puskesmas_wilayah: teksOpsional(200),
});
export const fasyankes = id.extend(fasyankesMasukan.shape).extend(jejak.shape);

export const kredensialSatusehatMasukan = z.object({
  environment: environmentSatusehat,
  client_id: teksWajib(),
  client_secret: z.string().min(1),
});

// Lokasi
export const lokasiMasukan = z.object({
  nama: teksWajib(),
  jenis: jenisLokasi,
  induk_id: idPositif.nullish(),
  status_operasional: statusOperasional.default('O'),
  ihs_location_id: teksOpsional(100),
});
export const lokasi = id.extend(lokasiMasukan.shape).extend(jejak.shape);

// Pengguna
export const penggunaMasukan = z.object({
  nama: teksWajib(),
  nik,
  username: z.string().trim().min(3).max(100),
});
export const pengguna = id
  .extend(penggunaMasukan.shape)
  .extend({ aktif: z.boolean(), wajib_ganti_kredensial: z.boolean() })
  .extend(jejak.shape);

// Profil profesi
export const profilProfesiMasukan = z.object({
  profesi: teksWajib(100),
  nomor_sip: teksOpsional(100),
  masa_berlaku_sip: tanggal.nullish(),
  ihs_practitioner_id: teksOpsional(100),
});
export const profilProfesi = id
  .extend({ pengguna_id: idPositif })
  .extend(profilProfesiMasukan.shape)
  .extend(jejak.shape);

// Pasien
export const pasienMasukan = z.object({
  nomor_rm: teksWajib(50),
  nik: nik.nullish(),
  nama: teksWajib(),
  ibu_kandung: teksOpsional(),
  tempat_lahir: teksOpsional(100),
  tanggal_lahir: z.coerce.date(), // tanggal lahir boleh sebelum 2014
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
  ihs_number: teksOpsional(100),
  jkn_nomor_kartu: teksOpsional(50),
  jkn_kelas_hak: teksOpsional(20),
  jkn_fktp_terdaftar: teksOpsional(200),
});
export const pasien = id.extend(pasienMasukan.shape).extend(jejak.shape);

// Wali
export const waliKeluargaMasukan = z.object({
  hubungan: teksWajib(100),
  nama: teksWajib(),
  kontak: teksOpsional(100),
});
export const waliKeluarga = id
  .extend({ pasien_id: idPositif })
  .extend(waliKeluargaMasukan.shape)
  .extend(jejak.shape);

// Jenis akun dan izin
export const jenisAkun = id
  .extend({
    nama: teksWajib(150),
    syarat_profesi: teksOpsional(),
    aktif: z.boolean(),
    diubah_oleh: idPositif.nullish(),
    alasan_perubahan: teksOpsional(1000),
  })
  .extend(jejak.shape);

export const izin = id.extend({
  fasyankes_id: idPositif.nullable(),
  fitur: teksWajib(100),
  aksi: aksiIzin,
  cakupan: cakupanIzin,
});

export const penugasanJenisMasukan = z
  .object({ jenis_akun_id: idPositif, mulai: tanggal, selesai: tanggal.nullish() })
  .refine((p) => !p.selesai || p.selesai >= p.mulai, { path: ['selesai'], message: 'Selesai tidak boleh sebelum mulai.' });
export const penugasanJenis = id
  .extend({ pengguna_id: idPositif, jenis_akun_id: idPositif, mulai: z.coerce.date(), selesai: z.coerce.date().nullable() })
  .extend({ ditetapkan_oleh: idPositif.nullable() })
  .extend(jejak.shape);

export const izinPerAkunMasukan = z
  .object({ izin_id: idPositif, tipe: tipeIzinAkun, alasan, mulai: tanggal, selesai: tanggal.nullish() })
  .refine((p) => !p.selesai || p.selesai >= p.mulai, { path: ['selesai'], message: 'Selesai tidak boleh sebelum mulai.' });
export const izinPerAkun = id
  .extend({
    pengguna_id: idPositif,
    izin_id: idPositif,
    tipe: tipeIzinAkun,
    alasan,
    mulai: z.coerce.date(),
    selesai: z.coerce.date().nullable(),
    ditetapkan_oleh: idPositif.nullable(),
  })
  .extend(jejak.shape);

export const peringatanIzinMasukan = z
  .object({
    izin_id: idPositif.nullish(),
    penugasan_id: idPositif.nullish(),
    jenis_peringatan: teksWajib(100),
    alasan_pimpinan: alasan,
  })
  .refine((p) => p.izin_id != null || p.penugasan_id != null, { message: 'Izin atau penugasan wajib ada.' });
export const peringatanIzin = id
  .extend({
    pengguna_id: idPositif,
    izin_id: idPositif.nullable(),
    penugasan_id: idPositif.nullable(),
    jenis_peringatan: teksWajib(100),
    alasan_pimpinan: alasan,
    ditetapkan_oleh: idPositif.nullable(),
    waktu: z.coerce.date(),
  })
  .extend(jejak.shape);
