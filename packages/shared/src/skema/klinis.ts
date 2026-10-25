import { z } from 'zod';
import { GALAT, KLINIS } from '../teks';
import type { CaraPembayaran, JenisKunjungan, StatusPengesahan, TahapLayanan } from '../status';
import {
  BAGIAN_KLINIS, BAGIAN_TEMPLAT, JENIS_FAVORIT, JENIS_TINDAK_LANJUT, PEMERIKSAAN_BIDANG, PERAN_DIAGNOSIS, POLA_ICD10, POLA_ICD9CM, SISTEM_TERMINOLOGI, TANDA_VITAL,
} from '../klinis';
import type { BagianKlinis, BagianTemplat, JenisFavorit, JenisTindakLanjut, KunciTandaVital, PeranDiagnosis, SistemTerminologi, BidangPemeriksaan } from '../klinis';
import { idPositif, tanggal, teksWajib } from './umum';
import type { KunjunganDto } from './kunjungan';

const kosongJadiNull = (v: unknown) => (v === undefined || v === null || (typeof v === 'string' && v.trim() === '') ? null : v);
/** Teks opsional yang dinormalkan: kosong menjadi null (isi kanonik untuk hash harus stabil). */
const teksNull = (maks: number) => z.preprocess(kosongJadiNull, z.string().trim().max(maks).nullable());

export const bagianKlinis = z.enum(BAGIAN_KLINIS);

// Anamnesis
const anamnesisDasar = {
  penyerta: teksNull(1000),
  riwayat_pribadi: teksNull(1000),
  riwayat_keluarga: teksNull(1000),
  alergi: teksNull(500),
};
export const anamnesisIsi = z.object({ keluhan_utama: teksWajib(1000), ...anamnesisDasar });
export type AnamnesisIsi = z.infer<typeof anamnesisIsi>;

// Tanda vital: angka per kunci (kosong = tidak diukur), minimal satu nilai.
const angkaTandaVital = (t: (typeof TANDA_VITAL)[number]) =>
  z.preprocess(
    (v) => (typeof v === 'string' ? (v.trim() === '' ? null : Number(v.replace(',', '.'))) : kosongJadiNull(v)),
    z.number(KLINIS.galat.angka).min(t.min, KLINIS.galat.rentang(t.min, t.max)).max(t.max, KLINIS.galat.rentang(t.min, t.max)).nullable(),
  );
const bentukTandaVital = Object.fromEntries(TANDA_VITAL.map((t) => [t.kunci, angkaTandaVital(t)])) as Record<KunciTandaVital, ReturnType<typeof angkaTandaVital>>;
export const tandaVitalIsi = z.object(bentukTandaVital).refine((d) => Object.values(d).some((v) => v !== null), { message: KLINIS.galat.tandaVitalKosong });
export type TandaVitalIsi = Record<KunciTandaVital, number | null>;

// Pemeriksaan fisik: teks per bidang, minimal satu terisi.
const bentukPemeriksaan = Object.fromEntries(PEMERIKSAAN_BIDANG.map((b) => [b, teksNull(1000)])) as Record<BidangPemeriksaan, ReturnType<typeof teksNull>>;
export const pemeriksaanIsi = z.object(bentukPemeriksaan).refine((d) => Object.values(d).some((v) => v !== null), { message: KLINIS.galat.pemeriksaanKosong });
export type PemeriksaanIsi = Record<BidangPemeriksaan, string | null>;

// Diagnosis ICD-10: tepat satu peran utama.
export const diagnosisItem = z.object({
  kode: z.string().trim().toUpperCase().regex(POLA_ICD10, KLINIS.galat.kodeIcd10),
  nama: teksWajib(500),
  peran: z.enum(PERAN_DIAGNOSIS),
  snomed: teksNull(30),
});
export const diagnosisIsi = z
  .object({ item: z.array(diagnosisItem).min(1, KLINIS.galat.diagnosisKosong).max(20) })
  .superRefine((d, ctx) => {
    if (d.item.filter((i) => i.peran === 'utama').length !== 1) ctx.addIssue({ code: 'custom', path: ['item'], message: KLINIS.galat.diagnosisUtama });
    const kode = d.item.map((i) => i.kode);
    if (new Set(kode).size !== kode.length) ctx.addIssue({ code: 'custom', path: ['item'], message: KLINIS.galat.kodeGanda });
  });
export type DiagnosisItem = z.infer<typeof diagnosisItem>;
export type DiagnosisIsi = z.infer<typeof diagnosisIsi>;

// Tindakan ICD-9 CM
export const tindakanItem = z
  .object({
    kode: z.string().trim().regex(POLA_ICD9CM, KLINIS.galat.kodeIcd9),
    nama: teksWajib(500),
    performer_id: idPositif.nullish(),
    mulai: tanggal.transform((d) => d.toISOString()),
    selesai: z.preprocess(kosongJadiNull, tanggal.transform((d) => d.toISOString()).nullable()),
  })
  .refine((t) => !t.selesai || t.selesai >= t.mulai, { path: ['selesai'], message: KLINIS.galat.selesaiSebelumMulai });
export const tindakanIsi = z.object({ item: z.array(tindakanItem).max(30) }).superRefine((d, ctx) => {
  const kode = d.item.map((i) => i.kode);
  if (new Set(kode).size !== kode.length) ctx.addIssue({ code: 'custom', path: ['item'], message: KLINIS.galat.kodeGanda });
});
export type TindakanItem = z.infer<typeof tindakanItem>;
export type TindakanIsi = z.infer<typeof tindakanIsi>;

// Rencana tindak lanjut: pilihan saja, belum menjalankan admisi.
export const tindakLanjutIsi = z
  .object({
    jenis: z.enum(JENIS_TINDAK_LANJUT),
    tujuan: teksNull(300),
    spri: teksNull(100),
    catatan: teksNull(1000),
  })
  .superRefine((d, ctx) => {
    if (d.jenis === 'rujuk' && !d.tujuan) ctx.addIssue({ code: 'custom', path: ['tujuan'], message: KLINIS.galat.tujuanRujuk });
  })
  .transform((d) => ({ ...d, tujuan: d.jenis === 'pulang' ? null : d.tujuan, spri: d.jenis === 'rawat_inap' ? d.spri : null }));
export type TindakLanjutIsi = z.infer<typeof tindakLanjutIsi>;

/** Skema isi per bagian; `alasan` wajib saat memperbaiki bagian yang sudah disahkan. */
export const SKEMA_BAGIAN = {
  anamnesis: anamnesisIsi, tanda_vital: tandaVitalIsi, pemeriksaan: pemeriksaanIsi, diagnosis: diagnosisIsi, tindakan: tindakanIsi, tindak_lanjut: tindakLanjutIsi,
} as const satisfies Record<BagianKlinis, z.ZodType>;
export type IsiBagian = {
  anamnesis: AnamnesisIsi; tanda_vital: TandaVitalIsi; pemeriksaan: PemeriksaanIsi; diagnosis: DiagnosisIsi; tindakan: TindakanIsi; tindak_lanjut: TindakLanjutIsi;
};

export const simpanBagianMasukan = z.object({ isi: z.unknown(), alasan: z.string().trim().max(500).optional() });
export const bagianParam = z.object({ id: z.coerce.number().int().positive(), bagian: bagianKlinis });
export const selesaiPemeriksaanMasukan = z.object({ tahap: z.enum(['resep', 'kasir']).default('kasir') });

// Draf alur klinis (4.2 Draf): isi sementara disimpan di server, bukan di peramban klinik bersama.
export const ALUR_DRAF_KLINIS = ['pemeriksaan-klinis', 'skrining'] as const;
export type AlurDrafKlinis = (typeof ALUR_DRAF_KLINIS)[number];
/** Masa berlaku draf klinis di server sejak pembaruan terakhir. */
export const KEDALUWARSA_DRAF_KLINIS_JAM = 12;
export const BATAS_ISI_DRAF_KLINIS = 80_000;
export const drafParam = z.object({ id: z.coerce.number().int().positive(), alur: z.enum(ALUR_DRAF_KLINIS) });
export const drafMasukan = z.object({
  langkah: z.number().int().min(0).max(20),
  isi: z.record(z.string(), z.unknown()).refine((v) => JSON.stringify(v).length <= BATAS_ISI_DRAF_KLINIS, { message: GALAT.tidakValid }),
});
export type DrafMasukan = z.infer<typeof drafMasukan>;
export type DrafKlinisDto = { alur: AlurDrafKlinis; kunjungan_id: number; langkah: number; isi: Record<string, unknown>; diperbarui_pada: string };

// Respons
export type PengesahanDto = {
  versi: number;
  pengguna_id: number;
  pengguna_nama: string;
  jenis_akun: string | null;
  waktu: string;
  hash: string;
};
export type BagianKlinisDto<K extends BagianKlinis = BagianKlinis> = {
  bagian: K;
  /** Isi sekarang (versi terakhir tersimpan), null bila belum pernah disimpan. */
  isi: IsiBagian[K] | null;
  pengesahan: PengesahanDto | null;
  verifikasi: StatusPengesahan;
};
export type KlinisKunjunganDto = {
  kunjungan: KunjunganDto;
  bagian: { [K in BagianKlinis]: BagianKlinisDto<K> };
};
export type KonteksKlinisDto = {
  pasien: { id: number; nama: string; nomor_rm: string; jenis_kelamin: 'laki_laki' | 'perempuan'; umur_tahun: number };
  kunjungan: {
    id: number; jenis: JenisKunjungan; tahap_layanan: TahapLayanan; cara_pembayaran: CaraPembayaran;
    poli_nama: string | null; dpjp_nama: string | null; keluhan_singkat: string | null;
  };
  alergi: string | null;
  diagnosis_aktif: { kode: string; nama: string }[];
  tanda_vital_terakhir: TandaVitalIsi | null;
};
export type RiwayatKunjunganDto = {
  id: number; mulai: string; jenis: JenisKunjungan; poli_nama: string | null; keluhan_utama: string | null;
  diagnosis: { kode: string; nama: string; peran: PeranDiagnosis }[]; tindak_lanjut: JenisTindakLanjut | null;
};
export type SalinanKunjunganDto = {
  sumber: { id: number; mulai: string };
  anamnesis: AnamnesisIsi | null;
  diagnosis: DiagnosisIsi | null;
  tindakan: TindakanIsi | null;
};
export type VerifikasiDto = { entitas: string; entitas_id: number; status: StatusPengesahan; versi: number | null; pengesahan: PengesahanDto | null };
export type VersiCatatanDto = { versi: number; alasan: string; disetujui_oleh: number | null; dibuat_oleh: number | null; dibuat_pada: string };

// Terminologi
export const sistemTerminologi = z.enum(SISTEM_TERMINOLOGI);
export const cariTerminologiMasukan = z.object({
  sistem: sistemTerminologi,
  q: z.string().trim().min(1, KLINIS.galat.pencarianKosong).max(100),
  batas: z.coerce.number().int().min(1).max(50).default(10),
});
export type CariTerminologiMasukan = z.infer<typeof cariTerminologiMasukan>;
export type KodeTerminologiDto = { sistem: SistemTerminologi; kode: string; nama: string; contoh: boolean };

// Favorit dan templat
export const favoritMasukan = z.object({ jenis: z.enum(JENIS_FAVORIT), kode: teksWajib(50), nama: teksWajib(255) });
export const ubahFavoritMasukan = z.object({ urutan: z.number().int().min(0).max(10_000) });
export const filterFavorit = z.object({ jenis: z.enum(JENIS_FAVORIT).optional() });
export type FavoritDto = { id: number; jenis: JenisFavorit; kode: string; nama: string; urutan: number };

const templatAnamnesis = z.object({ keluhan_utama: teksNull(1000), ...anamnesisDasar });
const templatPemeriksaan = z.object(bentukPemeriksaan);
export const templatMasukan = z.discriminatedUnion('bagian', [
  z.object({ bagian: z.literal('anamnesis'), nama: teksWajib(100), isi: templatAnamnesis }),
  z.object({ bagian: z.literal('pemeriksaan'), nama: teksWajib(100), isi: templatPemeriksaan }),
]);
export const filterTemplat = z.object({ bagian: z.enum(BAGIAN_TEMPLAT).optional() });
export type TemplatDto = { id: number; bagian: BagianTemplat; nama: string; isi: Record<string, string | null> };
export type TemplatMasukan = z.infer<typeof templatMasukan>;

// Family folder
export const keluargaMasukan = z.object({ anggota_pasien_id: idPositif, hubungan: teksWajib(100) });
export const ubahKeluargaMasukan = z
  .object({ hubungan: teksWajib(100).optional(), dibatasi: z.boolean().optional() })
  .refine((d) => d.hubungan !== undefined || d.dibatasi !== undefined, { message: KLINIS.galat.tidakAdaPerubahan });
export type AnggotaKeluargaDto = {
  id: number;
  hubungan: string;
  dibatasi: boolean;
  /** null bila penanda privasi aktif (identitas anggota disembunyikan). */
  pasien: { id: number; nama: string; nomor_rm: string } | null;
};
export type FolderKeluargaDto = {
  wali: { id: number; hubungan: string; nama: string; kontak: string | null }[];
  anggota: AnggotaKeluargaDto[];
};
