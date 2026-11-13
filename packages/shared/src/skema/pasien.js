import { z } from 'zod';
import { nomorWhatsapp } from '../whatsapp.js';
import { GALAT, REGISTRASI } from '../teks.js';
import { jenisKelamin, waliKeluargaMasukan } from './entitas.js';
import { idPositif, nik, teksOpsional, teksWajib } from './umum.js';
export const JALUR_IDENTITAS = ['nik', 'paspor', 'kitas', 'tanpa_identitas'];
export const BENTUK_PERSETUJUAN = ['tertulis', 'lisan'];
export const PENANDATANGAN_PERSETUJUAN = ['pasien', 'wali'];
export const NILAI_TAHAP_FILTER = ['semua', 'menunggu_skrining', 'pemeriksaan', 'resep', 'kasir', 'ditutup', 'batal'];
const kosongJadiTiada = (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v);
/** Tanggal kalender YYYY-MM-DD yang sah dan bukan di masa depan (tanggal lahir boleh sebelum 2014). */
export const tanggalLahir = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, GALAT.tanggalLahir)
    .refine((t) => {
    const d = new Date(`${t}T00:00:00.000Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === t && d.getTime() <= Date.now() + 14 * 3_600_000;
}, GALAT.tanggalLahir);
const nikOpsional = z.preprocess(kosongJadiTiada, nik.nullish());
/** Nomor opsional; format lokal 08… dinormalkan menjadi 628… untuk kontak langsung. */
export const nomorHpPasien = z.string().trim().max(40).transform((value, ctx) => {
    if (!value)
        return null;
    const nomor = nomorWhatsapp(value);
    if (!nomor) {
        ctx.addIssue({ code: 'custom', message: 'Nomor HP tidak valid. Gunakan 08… atau kode negara, misalnya +628….' });
        return z.NEVER;
    }
    return nomor;
}).nullish();
/** Registrasi pasien baru (3.3): identitas, data sosial, alamat, jalur identitas khusus, wali, JKN, dan general consent dalam satu permintaan. */
export const registrasiPasienMasukan = z
    .object({
    jalur_identitas: z.enum(JALUR_IDENTITAS).default('nik'),
    nik: nikOpsional,
    nama: teksWajib(),
    nomor_hp: nomorHpPasien,
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
    asuransi_nama: teksOpsional(100),
    asuransi_nomor_polis: teksOpsional(50),
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
    const tambah = (path, pesan) => ctx.addIssue({ code: 'custom', path: path.split('.'), message: pesan });
    if (d.jalur_identitas === 'nik' && !d.nik)
        tambah('nik', REGISTRASI.galat.nikWajib);
    if (d.jalur_identitas === 'paspor' && !d.nomor_paspor?.trim())
        tambah('nomor_paspor', GALAT.wajibDiisi);
    if (d.jalur_identitas === 'kitas' && !d.nomor_kitas?.trim())
        tambah('nomor_kitas', GALAT.wajibDiisi);
    if (d.jalur_identitas === 'tanpa_identitas' && d.nik)
        tambah('nik', REGISTRASI.galat.nikHarusKosong);
    if (d.tidak_cakap && d.wali.length === 0)
        tambah('wali', REGISTRASI.galat.waliWajib);
    if (d.tidak_cakap && d.persetujuan.penandatangan !== 'wali')
        tambah('persetujuan.penandatangan', REGISTRASI.galat.penandatanganWali);
    if (d.persetujuan.penandatangan === 'wali' && (d.persetujuan.wali_ke == null || d.persetujuan.wali_ke >= d.wali.length)) {
        tambah('persetujuan.wali_ke', REGISTRASI.galat.waliPenandatangan);
    }
});
/** Status identitas dari jalur: hanya pasien tanpa identitas yang sementara. */
export const statusIdentitasDari = (jalur) => (jalur === 'tanpa_identitas' ? 'sementara' : 'lengkap');
export const cekDuplikatMasukan = z.object({
    nik: nikOpsional,
    nama: z.preprocess(kosongJadiTiada, z.string().trim().max(200).optional()),
    tanggal_lahir: z.preprocess(kosongJadiTiada, tanggalLahir.optional()),
    ibu_kandung: z.preprocess(kosongJadiTiada, z.string().trim().max(200).optional()),
});
/** Filter Daftar pasien (query string): pencarian nama/nomor RM/NIK, tahap layanan, paginasi. */
export const filterPasien = z.object({
    untuk_kunjungan: z.enum(['true']).optional(),
    tanggal: z.preprocess(kosongJadiTiada, z.iso.date().optional()),
    cari: z.preprocess(kosongJadiTiada, z.string().trim().max(100).optional()),
    tahap: z.preprocess(kosongJadiTiada, z.enum(NILAI_TAHAP_FILTER).default('semua')),
    halaman: z.coerce.number().int().min(1).default(1),
    ukuran: z.coerce.number().int().min(1).max(100).default(20),
});
/** Perbaikan demografi tanpa mengubah nomor RM atau persetujuan yang sudah diberikan. */
export const perbaikanPasienMasukan = z.object({
    ...registrasiPasienMasukan.shape,
    wali: z.array(waliKeluargaMasukan.extend({ id: idPositif.optional() })).max(10),
}).omit({ persetujuan: true, konfirmasi_duplikat: true }).superRefine((d, ctx) => {
    const tambah = (path, message) => ctx.addIssue({ code: 'custom', path: [path], message });
    if (d.jalur_identitas === 'nik' && !d.nik)
        tambah('nik', REGISTRASI.galat.nikWajib);
    if (d.jalur_identitas === 'paspor' && !d.nomor_paspor?.trim())
        tambah('nomor_paspor', GALAT.wajibDiisi);
    if (d.jalur_identitas === 'kitas' && !d.nomor_kitas?.trim())
        tambah('nomor_kitas', GALAT.wajibDiisi);
    if (d.jalur_identitas === 'tanpa_identitas' && d.nik)
        tambah('nik', REGISTRASI.galat.nikHarusKosong);
    if (d.tidak_cakap && !d.wali.length)
        tambah('wali', REGISTRASI.galat.waliWajib);
    const ids = d.wali.flatMap((w) => w.id ? [w.id] : []);
    if (new Set(ids).size !== ids.length)
        tambah('wali', 'Wali yang sama tercantum lebih dari sekali.');
});
