import { z } from 'zod';
import { PDP } from '../teks';
import { BUTIR_PERJANJIAN, DASAR_PEMROSESAN, DASAR_PEMUSNAHAN, HUBUNGAN_PEMOHON, JENIS_HAK, SALURAN_HAK } from '../pdp';
import type { ButirPerjanjian, StatusHak, StatusMusnah, TahapHak, TahapMusnah } from '../pdp';
import { idPositif, teksWajib } from './umum';

const G = PDP.galat;
const kosongJadiTiada = (v: unknown) => (v === '' || v === null ? undefined : v);
const teksNull = (maks: number) => z.string().trim().max(maks).nullish().transform((v) => v || null);
const tglIso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, G.tanggal);
/** Tanggal dan jam: bentuk datetime-local (TTTT-BB-HHTjj:mm, dibaca WIB) atau ISO lengkap. */
const waktuIso = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})?$/, G.waktu);
const waktuOpsional = z.preprocess(kosongJadiTiada, waktuIso.optional());
const halamanUkuran = { halaman: z.coerce.number().int().min(1).default(1), ukuran: z.coerce.number().int().min(1).max(100).default(20) };

/** Waktu dari isian (datetime-local dibaca WIB) menjadi Date. */
export const waktuDariIsian = (s: string): Date => new Date(/(Z|[+-]\d{2}:\d{2})$/.test(s) ? s : `${s.length === 16 ? `${s}:00` : s}+07:00`);

// ---- Permintaan hak pasien ----
export const hakMasukan = z.object({
  pasien_id: idPositif, jenis: z.enum(JENIS_HAK, { error: G.jenisHak }), saluran: z.enum(SALURAN_HAK, { error: G.saluran }), pemohon_nama: teksWajib(200),
  pemohon_hubungan: z.enum(HUBUNGAN_PEMOHON, { error: G.hubungan }), verifikasi: teksWajib(300), rincian: teksNull(1000),
});
export type HakMasukan = z.output<typeof hakMasukan>;
export type HakForm = z.input<typeof hakMasukan>;

export const prosesHakMasukan = z.discriminatedUnion('tahap', [
  z.object({ tahap: z.literal('keputusan'), keputusan: z.enum(['setujui', 'tolak'], { error: G.keputusan }), alasan: teksNull(500) }).superRefine((d, ctx) => {
    if (d.keputusan === 'tolak' && !d.alasan) ctx.addIssue({ code: 'custom', path: ['alasan'], message: G.alasanTolak });
  }),
  z.object({ tahap: z.literal('pelaksanaan'), pelaksanaan: teksWajib(1000) }),
  z.object({ tahap: z.literal('notifikasi'), catatan: teksNull(300) }),
]);
export type ProsesHakMasukan = z.output<typeof prosesHakMasukan>;
export type ProsesHakForm = z.input<typeof prosesHakMasukan>;

export const filterHak = z.object({
  status: z.preprocess(kosongJadiTiada, z.enum(['diterima', 'disetujui', 'ditolak', 'dilaksanakan', 'selesai']).optional()), cari: z.string().trim().optional(), ...halamanUkuran,
});
export type FilterHak = z.infer<typeof filterHak>;

export type HakDto = {
  id: number; pasien_id: number; pasien_nama: string; pasien_nomor_rm: string; jenis: (typeof JENIS_HAK)[number]; saluran: (typeof SALURAN_HAK)[number]; pemohon_nama: string; pemohon_hubungan: (typeof HUBUNGAN_PEMOHON)[number];
  verifikasi: string; rincian: string | null; diterima_pada: string; batas_waktu: string; status: StatusHak; terlambat: boolean; sisa_jam: number | null; tahap_berikut: TahapHak | null;
  alasan_keputusan: string | null; keputusan_nama: string | null; waktu_keputusan: string | null; pelaksanaan: string | null; waktu_pelaksanaan: string | null; notifikasi_pada: string | null; catatan_notifikasi: string | null;
};
export type HalamanHakDto = { data: HakDto[]; halaman: number; ukuran: number; total: number; aktif: number; terlambat: number };

// ---- Teks pemberitahuan dan penarikan persetujuan ----
export const pemberitahuanMasukan = z.object({ judul: teksWajib(200), tujuan: teksWajib(500), isi: teksWajib(20000) });
export type PemberitahuanMasukan = z.output<typeof pemberitahuanMasukan>;
export type TeksPemberitahuanDto = { id: number; versi: number; judul: string; tujuan: string; isi: string; aktif: boolean; dibuat_pada: string };

export const tarikMasukan = z.object({ persetujuan_id: idPositif, alasan: teksWajib(500) });
export type TarikMasukan = z.output<typeof tarikMasukan>;
export const filterPersetujuanPdp = z.object({ cari: z.string().trim().optional(), status: z.preprocess(kosongJadiTiada, z.enum(['diberikan', 'ditarik']).optional()), ...halamanUkuran });
export type FilterPersetujuanPdp = z.infer<typeof filterPersetujuanPdp>;
export type PersetujuanPdpDto = {
  id: number; pasien_id: number; pasien_nama: string; pasien_nomor_rm: string; jenis: string; versi_teks: number; tujuan: string; waktu: string; status: string; penandatangan_nama: string;
  penarikan: { alasan: string; waktu: string; batas_henti: string } | null;
};
export type HalamanPersetujuanPdpDto = { data: PersetujuanPdpDto[]; halaman: number; ukuran: number; total: number };

// ---- ROPA ----
export const ropaMasukan = z.object({
  nama_kegiatan: teksWajib(200), ppdp_nama: teksNull(200), sumber_tujuan: teksWajib(500), dasar: z.enum(DASAR_PEMROSESAN, { error: G.dasar }), tujuan: teksWajib(500), jenis_data: teksWajib(500), kategori_subjek: teksWajib(300),
  pihak_akses: teksWajib(500), pemenuhan_hak: teksWajib(500), aliran: teksWajib(500), masa_retensi: teksWajib(200), pengamanan: teksWajib(500), transfer: teksWajib(300),
});
export type RopaMasukan = z.output<typeof ropaMasukan>;
export type RopaDto = RopaMasukan & { id: number; diperbarui_pada: string };

// ---- DPIA ----
export const dpiaMasukan = z.object({
  pemrosesan: teksWajib(200), ropa_id: idPositif.nullish().transform((v) => v ?? null), risiko: teksWajib(4000), mitigasi: teksWajib(4000), saran_ppdp: teksNull(4000), tinjau_ulang_pada: tglIso, tandai_ditinjau: z.boolean().default(false),
});
export type DpiaMasukan = z.output<typeof dpiaMasukan>;
export type DpiaForm = z.input<typeof dpiaMasukan>;
export type DpiaDto = Omit<DpiaMasukan, 'tandai_ditinjau'> & { id: number; ropa_nama: string | null; ditinjau_pada: string | null; jatuh_tempo: boolean; diperbarui_pada: string };

// ---- Insiden ----
export const insidenMasukan = z
  .object({
    waktu_kejadian: waktuOpsional, waktu_diketahui: waktuIso, siber: z.boolean().default(false), uraian: teksWajib(4000), data_terungkap: teksWajib(1000), pasien_ids: z.array(idPositif).max(500, G.pasienBanyak).default([]),
    penanganan: teksNull(4000), pemulihan: teksNull(4000), kontak_ppdp: teksNull(200), notifikasi_pasien_pada: waktuOpsional, notifikasi_lembaga_pada: waktuOpsional,
  })
  .superRefine((d, ctx) => {
    if (d.waktu_kejadian && waktuDariIsian(d.waktu_kejadian) > waktuDariIsian(d.waktu_diketahui)) ctx.addIssue({ code: 'custom', path: ['waktu_kejadian'], message: G.kejadianSesudahDiketahui });
  });
export type InsidenMasukan = z.output<typeof insidenMasukan>;
export type InsidenForm = z.input<typeof insidenMasukan>;
export type InsidenDto = {
  id: number; waktu_kejadian: string | null; waktu_diketahui: string; siber: boolean; uraian: string; data_terungkap: string; penanganan: string | null; pemulihan: string | null; kontak_ppdp: string | null;
  batas_notifikasi: string; notifikasi_pasien_pada: string | null; notifikasi_lembaga_pada: string | null; sisa_jam: number | null; terlambat: boolean; jumlah_terdampak: number;
  pasien: { id: number; nama: string; nomor_rm: string }[];
};

// ---- Retensi dan pemusnahan ----
export type KebijakanRetensiDto = { id: number; jenis_data: string; periode_tahun: number; dasar_hukum: string; metode_musnah: string; penanggung_jawab: string | null };

export const pemusnahanMasukan = z.object({
  cakupan: teksWajib(500), dasar: z.enum(DASAR_PEMUSNAHAN, { error: G.dasarMusnah }), permintaan_hak_id: idPositif.nullish().transform((v) => v ?? null), pasien_id: idPositif.nullish().transform((v) => v ?? null), jadwal: tglIso,
});
export type PemusnahanMasukan = z.output<typeof pemusnahanMasukan>;
export type PemusnahanForm = z.input<typeof pemusnahanMasukan>;
export const prosesPemusnahanMasukan = z.discriminatedUnion('tahap', [
  z.object({ tahap: z.literal('perintah'), prosesor_id: idPositif, nomor_perintah: teksWajib(100) }),
  z.object({ tahap: z.literal('pelaksanaan'), pelaksana: teksWajib(200), metode: teksWajib(300), mencakup_cadangan: z.boolean().default(false), pelaksanaan_pada: waktuOpsional }),
  z.object({ tahap: z.literal('berita_acara'), berita_acara: teksWajib(4000) }),
]);
export type ProsesPemusnahanMasukan = z.output<typeof prosesPemusnahanMasukan>;
export type ProsesPemusnahanForm = z.input<typeof prosesPemusnahanMasukan>;
export type PemusnahanDto = {
  id: number; cakupan: string; dasar: (typeof DASAR_PEMUSNAHAN)[number]; permintaan_hak_id: number | null; pasien_id: number | null; pasien_nama: string | null; jadwal: string; status: StatusMusnah; tahap_berikut: TahapMusnah | null;
  prosesor_id: number | null; prosesor_nama: string | null; nomor_perintah: string | null; perintah_pada: string | null; pelaksana: string | null; metode: string | null; mencakup_cadangan: boolean; pelaksanaan_pada: string | null;
  berita_acara: string | null; berita_acara_pada: string | null; terlambat: boolean;
};

// ---- Prosesor ----
const subProsesor = z.object({ nama: teksWajib(200), layanan: teksWajib(300), persetujuan_pada: tglIso });
export const prosesorMasukan = z.object({
  nama: teksWajib(200), layanan: teksWajib(300), lokasi_data: teksWajib(200), nomor_perjanjian: teksNull(100), butir_perjanjian: z.array(z.enum(BUTIR_PERJANJIAN)).max(BUTIR_PERJANJIAN.length).default([]),
  sub_prosesor: z.array(subProsesor).max(20, G.subBanyak).default([]), sla_lapor_jam: z.preprocess(kosongJadiTiada, z.coerce.number({ error: G.sla }).int(G.sla).min(1, G.sla).max(72, G.sla).optional()).transform((v) => v ?? null), aktif: z.boolean().default(true),
});
export type ProsesorMasukan = z.output<typeof prosesorMasukan>;
export type ProsesorForm = z.input<typeof prosesorMasukan>;
export type ProsesorDto = Omit<ProsesorMasukan, 'butir_perjanjian'> & { id: number; butir_perjanjian: ButirPerjanjian[]; butir_kurang: ButirPerjanjian[]; diperbarui_pada: string };

export const filterUmumPdp = z.object({ ...halamanUkuran });
export type HalamanPdp<T> = { data: T[]; halaman: number; ukuran: number; total: number };

/** Ringkasan tugas PDP untuk Beranda tugas. */
export type RingkasanPdpDto = { hak_aktif: number; hak_terlambat: number; insiden_belum_notifikasi: number; insiden_terlambat: number; dpia_jatuh_tempo: number; pemusnahan_terlambat: number };
