import { z } from 'zod';
import { GALAT, PENUNJANG } from '../teks.js';
import { PRIORITAS_ORDER, INTERPRETASI_HASIL, STATUS_ORDER_PENUNJANG } from '../status.js';
import { idPositif, tanggal, teksWajib } from './umum.js';
const kosongJadiNull = (v) => (v === undefined || v === null || (typeof v === 'string' && v.trim() === '') ? null : v);
const teksNull = (maks) => z.preprocess(kosongJadiNull, z.string().trim().max(maks).nullable());
const angkaNull = z.preprocess((v) => (typeof v === 'string' ? (v.trim() === '' ? null : Number(v.replace(',', '.'))) : kosongJadiNull(v)), z.number(PENUNJANG.galat.angka).finite().nullable());
/** Kode LOINC: angka, tanda hubung, satu digit pemeriksa (mis. 718-7). */
export const POLA_LOINC = /^\d{1,7}-\d$/;
/** Pencarian katalog LOINC (baca-saja): minimal dua huruf, dibatasi hasilnya. */
export const filterLoinc = z.object({
    cari: z.string().trim().min(2, PENUNJANG.galat.cariPendek).max(100),
    batas: z.coerce.number().int().min(1).max(50).default(10),
});
export const NILAI_PRIORITAS = PRIORITAS_ORDER.nilai;
export const NILAI_INTERPRETASI = INTERPRETASI_HASIL.nilai;
export const NILAI_STATUS_ORDER = STATUS_ORDER_PENUNJANG.nilai;
/** Harga dalam rupiah (bilangan bulat tidak negatif); kosong menjadi null. */
const hargaNull = z.preprocess((v) => (typeof v === 'string' ? (v.trim() === '' ? null : Number(v.replace(/\./g, ''))) : kosongJadiNull(v)), z.number({ error: PENUNJANG.galat.angka }).int(PENUNJANG.galat.angka).min(0, PENUNJANG.galat.angka).max(100_000_000, PENUNJANG.galat.angka).nullable());
const masterDasar = {
    kode: teksWajib(50),
    nama: teksWajib(200),
    kode_loinc: z.preprocess(kosongJadiNull, z.string().trim().regex(POLA_LOINC, PENUNJANG.galat.loinc).nullable()),
    jenis_spesimen: teksNull(100),
    satuan: teksNull(50),
    rujukan_min: angkaNull,
    rujukan_maks: angkaNull,
    rujukan_teks: teksNull(200),
    /** Bila `harga_umum` diisi, tarif lab (kode sama dengan kode pemeriksaan) dibuat atau diperbarui otomatis dan ditautkan. */
    harga_umum: hargaNull,
    harga_jkn: hargaNull,
    tarif_layanan_id: z.preprocess((v) => (typeof v === 'string' && v.trim() !== '' ? Number(v) : kosongJadiNull(v)), idPositif.nullable()),
    aktif: z.boolean().default(true),
};
const cekRentang = (d) => d.rujukan_min == null || d.rujukan_maks == null || d.rujukan_min <= d.rujukan_maks;
/** Master pemeriksaan penunjang lokal (4.9): satuan UCUM, rentang rujukan klinik; harga lewat tarif layanan jenis lab. */
export const masterPemeriksaanMasukan = z.object(masterDasar).refine(cekRentang, { path: ['rujukan_maks'], message: PENUNJANG.galat.rentang });
export const ubahMasterPemeriksaanMasukan = z
    .object({ ...masterDasar, aktif: z.boolean() })
    .partial()
    .refine(cekRentang, { path: ['rujukan_maks'], message: PENUNJANG.galat.rentang })
    .refine((d) => Object.values(d).some((v) => v !== undefined), { message: PENUNJANG.galat.tidakAdaPerubahan });
export const filterMasterPemeriksaan = z.object({
    cari: z.preprocess((v) => (v === '' ? undefined : v), z.string().trim().max(100).optional()),
    aktif: z.preprocess((v) => (v === 'true' ? true : v === 'false' ? false : undefined), z.boolean().optional()),
});
/** Order lab (MODAL-1): pemeriksaan (satu atau lebih), prioritas, catatan. Satu baris order per pemeriksaan. */
export const orderLabMasukan = z.object({
    pemeriksaan_ids: z.array(idPositif).min(1, PENUNJANG.galat.pilihPemeriksaan).max(20).refine((a) => new Set(a).size === a.length, { message: PENUNJANG.galat.pemeriksaanGanda }),
    prioritas: z.enum(NILAI_PRIORITAS).default('rutin'),
    catatan: teksNull(500),
});
/** Ambil spesimen (MODAL-1): asal spesimen, waktu ambil, petugas (bawaan pengguna sendiri). */
export const spesimenMasukan = z.object({
    asal: teksWajib(100),
    waktu_ambil: tanggal.refine((d) => d.getTime() <= Date.now() + 5 * 60_000, { message: PENUNJANG.galat.waktuMasaDepan }).transform((d) => d.toISOString()),
    petugas_id: idPositif.nullish(),
});
/** Hasil lab: nilai dan interpretasi (disimpan sebelum validasi); validasi adalah langkah terpisah. */
export const hasilMasukan = z.object({
    nilai: teksWajib(200),
    interpretasi: z.enum(NILAI_INTERPRETASI, { message: PENUNJANG.galat.pilihInterpretasi }),
    catatan: teksNull(1000),
});
const kosongJadiTiada = (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v);
const tglIso = z.preprocess(kosongJadiTiada, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, GALAT.tanggal).optional());
/** Rekap lab: filter status dan rentang tanggal order (zona Asia/Jakarta). */
export const filterRekapLab = z.object({
    status: z.preprocess(kosongJadiTiada, z.enum(NILAI_STATUS_ORDER).optional()),
    dari: tglIso,
    sampai: tglIso,
    halaman: z.coerce.number().int().min(1).default(1),
    ukuran: z.coerce.number().int().min(1).max(100).default(20),
});
