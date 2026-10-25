import { z } from 'zod';
import { GALAT, PENUNJANG } from '../teks';
import type { InterpretasiHasil, PrioritasOrder, StatusOrderPenunjang, StatusPengesahan, StatusPembayaran, StatusTagihan } from '../status';
import { PRIORITAS_ORDER, INTERPRETASI_HASIL, STATUS_ORDER_PENUNJANG } from '../status';
import { idPositif, tanggal, teksWajib } from './umum';
import type { PengesahanDto } from './klinis';
import type { AddendumDto } from './addendum';

const kosongJadiNull = (v: unknown) => (v === undefined || v === null || (typeof v === 'string' && v.trim() === '') ? null : v);
const teksNull = (maks: number) => z.preprocess(kosongJadiNull, z.string().trim().max(maks).nullable());
const angkaNull = z.preprocess((v) => (typeof v === 'string' ? (v.trim() === '' ? null : Number(v.replace(',', '.'))) : kosongJadiNull(v)), z.number(PENUNJANG.galat.angka).finite().nullable());

/** Kode LOINC: angka, tanda hubung, satu digit pemeriksa (mis. 718-7). */
export const POLA_LOINC = /^\d{1,7}-\d$/;
export const NILAI_PRIORITAS = PRIORITAS_ORDER.nilai;
export const NILAI_INTERPRETASI = INTERPRETASI_HASIL.nilai;
export const NILAI_STATUS_ORDER = STATUS_ORDER_PENUNJANG.nilai;

const masterDasar = {
  kode: teksWajib(50),
  nama: teksWajib(200),
  kode_loinc: z.preprocess(kosongJadiNull, z.string().trim().regex(POLA_LOINC, PENUNJANG.galat.loinc).nullable()),
  jenis_spesimen: teksNull(100),
  satuan: teksNull(50),
  rujukan_min: angkaNull,
  rujukan_maks: angkaNull,
  rujukan_teks: teksNull(200),
  tarif_layanan_id: z.preprocess(kosongJadiNull, idPositif.nullable()),
  aktif: z.boolean().default(true),
};
const cekRentang = (d: { rujukan_min?: number | null; rujukan_maks?: number | null }) => d.rujukan_min == null || d.rujukan_maks == null || d.rujukan_min <= d.rujukan_maks;

/** Master pemeriksaan penunjang lokal (4.9): satuan UCUM, rentang rujukan klinik; harga lewat tarif layanan jenis lab. */
export const masterPemeriksaanMasukan = z.object(masterDasar).refine(cekRentang, { path: ['rujukan_maks'], message: PENUNJANG.galat.rentang });
export type MasterPemeriksaanMasukan = z.infer<typeof masterPemeriksaanMasukan>;
export const ubahMasterPemeriksaanMasukan = z
  .object({ ...masterDasar, aktif: z.boolean() })
  .partial()
  .refine(cekRentang, { path: ['rujukan_maks'], message: PENUNJANG.galat.rentang })
  .refine((d) => Object.values(d).some((v) => v !== undefined), { message: PENUNJANG.galat.tidakAdaPerubahan });
export type UbahMasterPemeriksaanMasukan = z.infer<typeof ubahMasterPemeriksaanMasukan>;
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
export type OrderLabMasukan = z.infer<typeof orderLabMasukan>;
export type OrderLabKirim = z.input<typeof orderLabMasukan>;

/** Ambil spesimen (MODAL-1): asal spesimen, waktu ambil, petugas (bawaan pengguna sendiri). */
export const spesimenMasukan = z.object({
  asal: teksWajib(100),
  waktu_ambil: tanggal.refine((d) => d.getTime() <= Date.now() + 5 * 60_000, { message: PENUNJANG.galat.waktuMasaDepan }).transform((d) => d.toISOString()),
  petugas_id: idPositif.nullish(),
});
export type SpesimenMasukan = z.infer<typeof spesimenMasukan>;

/** Hasil lab: nilai dan interpretasi (disimpan sebelum validasi); validasi adalah langkah terpisah. */
export const hasilMasukan = z.object({
  nilai: teksWajib(200),
  interpretasi: z.enum(NILAI_INTERPRETASI, { message: PENUNJANG.galat.pilihInterpretasi }),
  catatan: teksNull(1000),
});
export type HasilMasukan = z.infer<typeof hasilMasukan>;

const kosongJadiTiada = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? undefined : v);
const tglIso = z.preprocess(kosongJadiTiada, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, GALAT.tanggal).optional());
/** Rekap lab: filter status dan rentang tanggal order (zona Asia/Jakarta). */
export const filterRekapLab = z.object({
  status: z.preprocess(kosongJadiTiada, z.enum(NILAI_STATUS_ORDER).optional()),
  dari: tglIso,
  sampai: tglIso,
  halaman: z.coerce.number().int().min(1).default(1),
  ukuran: z.coerce.number().int().min(1).max(100).default(20),
});
export type FilterRekapLab = z.infer<typeof filterRekapLab>;

export type TarifLabDto = { id: number; kode: string; nama: string; harga_umum: number; harga_jkn: number | null };
export type MasterPemeriksaanDto = {
  id: number; kode: string; nama: string; kode_loinc: string | null; loinc_contoh: boolean; jenis_spesimen: string | null; satuan: string | null;
  rujukan_min: number | null; rujukan_maks: number | null; rujukan_teks: string | null; aktif: boolean; tarif: TarifLabDto | null;
};

export type SpesimenDto = { asal: string; waktu_ambil: string; petugas_id: number; petugas_nama: string };
export type HasilDto = {
  nilai: string; satuan: string | null; rujukan_teks: string | null; interpretasi: InterpretasiHasil; catatan: string | null;
  dientri_oleh: string; dientri_pada: string; validator_nama: string | null; divalidasi_pada: string | null;
};
export type OrderPenunjangDto = {
  id: number; kunjungan_id: number; pasien_id: number; nama: string; kode_loinc: string | null; prioritas: PrioritasOrder; catatan: string | null;
  status: StatusOrderPenunjang; dibuat_pada: string; dibuat_oleh_nama: string | null;
  /** Rentang rujukan dan satuan master sekarang (acuan mengisi hasil); hasil menyimpan salinannya saat diisi. */
  satuan: string | null; rujukan_teks: string | null; rujukan_min: number | null; rujukan_maks: number | null; jenis_spesimen: string | null;
  spesimen: SpesimenDto | null; hasil: HasilDto | null; pengesahan: PengesahanDto | null; verifikasi: StatusPengesahan; addendum: AddendumDto[];
};
export type RekapLabBarisDto = {
  id: number; kunjungan_id: number; pasien_nama: string; pasien_nomor_rm: string; nama: string; prioritas: PrioritasOrder; status: StatusOrderPenunjang;
  dibuat_pada: string; hasil_singkat: string | null; interpretasi: InterpretasiHasil | null;
};
export type RekapLabDto = {
  data: RekapLabBarisDto[]; halaman: number; ukuran: number; total: number; jumlah_status: Record<StatusOrderPenunjang, number>;
};
export type HasilBuatOrderDto = { order: OrderPenunjangDto[]; tagihan: { status_tagihan: StatusTagihan; status_pembayaran: StatusPembayaran; total: number } };
export type FilterMasterPemeriksaan = z.infer<typeof filterMasterPemeriksaan>;
