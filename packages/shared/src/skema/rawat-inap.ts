import { z } from 'zod';
import { RAWAT_INAP } from '../teks';
import { DISPOSISI_PULANG, INDIKATOR_KELAS, KELAS_RAWAT } from '../status';
import type { DisposisiPulang, IndikatorKelas, KelasRawat, StatusBed, StatusPengesahan } from '../status';
import { tandaVitalIsi } from './klinis';
import type { PengesahanDto, TandaVitalIsi } from './klinis';
import { idPositif, teksOpsional, teksWajib } from './umum';

const R = RAWAT_INAP.galat;
const teksNull = (maks: number) => z.string().trim().max(maks).nullish().transform((v) => v || null);
const kelas = z.enum(KELAS_RAWAT.nilai, { error: R.kelas });
const indikator = z.enum(INDIKATOR_KELAS.nilai, { error: R.indikator }).default('kelas_tetap');
const dpjpBersama = z.array(idPositif).max(10, R.dpjpBanyak).default([]);

/** DPJP utama tidak boleh ikut daftar DPJP bersama dan daftar tidak boleh ganda. */
const periksaDpjp = (d: { dpjp_id: number; dpjp_bersama: number[] }, ctx: z.RefinementCtx) => {
  if (d.dpjp_bersama.includes(d.dpjp_id) || new Set(d.dpjp_bersama).size !== d.dpjp_bersama.length) ctx.addIssue({ code: 'custom', path: ['dpjp_bersama'], message: R.dpjpGanda });
};

/** Admisi (3.3): pasien, ruang/bed (boleh menyusul: menunggu ruangan), kelas dan indikator, DPJP, SPRI. Dari rawat jalan: kunjungan berjalan ikut diteruskan. */
export const admisiMasukan = z
  .object({
    pasien_id: idPositif, bed_id: idPositif.nullish(), kelas, indikator, tarif_id: idPositif.nullish(), dpjp_id: idPositif, dpjp_bersama: dpjpBersama, spri: teksNull(100), keluhan_singkat: teksNull(500),
    cara_pembayaran: z.enum(['umum', 'jkn']).default('umum'),
  })
  .superRefine(periksaDpjp);
export type AdmisiMasukan = z.output<typeof admisiMasukan>;
export type AdmisiForm = z.input<typeof admisiMasukan>;

/** Ubah penempatan: pindah bed/kelas (bed kosong = tetap di bed sekarang) dan/atau ganti DPJP; alasan wajib bila pindah. */
export const penempatanMasukan = z
  .object({ bed_id: idPositif.nullish(), kelas, indikator, tarif_id: idPositif.nullish(), dpjp_id: idPositif, dpjp_bersama: dpjpBersama, alasan: teksOpsional(300) })
  .superRefine(periksaDpjp);
export type PenempatanMasukan = z.output<typeof penempatanMasukan>;
export type PenempatanForm = z.input<typeof penempatanMasukan>;

/** Catatan harian (CPPT): SOAP, instruksi, tanda vital opsional; disahkan saat disimpan. */
export const catatanHarianMasukan = z.object({
  subjektif: teksWajib(2000), objektif: teksWajib(2000), asesmen: teksWajib(2000), rencana: teksWajib(2000), instruksi: teksNull(2000), tanda_vital: tandaVitalIsi.nullish(),
});
export type CatatanHarianMasukan = z.output<typeof catatanHarianMasukan>;
export type CatatanHarianForm = z.input<typeof catatanHarianMasukan>;

/** Pemulangan: ringkasan, diagnosis akhir, kondisi dan disposisi, tindak lanjut; resume medis dibuat dari isian ini bila diminta. */
export const pemulanganMasukan = z.object({
  disposisi: z.enum(DISPOSISI_PULANG.nilai, { error: R.disposisi }),
  kondisi_pulang: teksWajib(300), diagnosis_akhir: teksWajib(500), ringkasan: teksWajib(3000), tindak_lanjut: teksNull(1000), terapi: teksNull(1000), buat_resume: z.boolean().default(true),
});
export type PemulanganMasukan = z.output<typeof pemulanganMasukan>;
export type PemulanganForm = z.input<typeof pemulanganMasukan>;

// ---- Respons ----
export type PenghuniBedDto = { kunjungan_id: number; pasien_id: number; pasien_nama: string; pasien_nomor_rm: string; kelas: KelasRawat; indikator: IndikatorKelas; mulai: string; dpjp_nama: string | null };
export type BedDto = { id: number; nama: string; ruang_id: number | null; ruang_nama: string | null; status: StatusBed; penghuni: PenghuniBedDto | null };
export type MenungguRuanganDto = { kunjungan_id: number; pasien_id: number; pasien_nama: string; pasien_nomor_rm: string; mulai: string; dpjp_nama: string | null };
export type PapanDto = { bed: BedDto[]; menunggu: MenungguRuanganDto[]; ringkasan: { total: number; terisi: number; kosong: number; tidak_operasional: number } };

export type OpsiRawatInapDto = {
  bed_kosong: { id: number; nama: string; ruang_nama: string | null }[];
  tarif_kamar: { id: number; kode: string; nama: string; harga_umum: number; harga_jkn: number | null }[];
  dpjp: { id: number; nama: string; profesi: string }[];
};
export type AsalAdmisiDto = {
  asal: { kunjungan_id: number; tahap_layanan: string; poli_nama: string | null; cara_pembayaran: 'umum' | 'jkn'; spri: string | null } | null;
  rawat_inap_id: number | null;
  ada_pembayaran: boolean;
};
export type PenempatanDto = { id: number; bed_id: number; bed_nama: string | null; ruang_nama: string | null; kelas: KelasRawat; indikator: IndikatorKelas; tarif_id: number | null; tarif_nama: string | null; mulai: string; selesai: string | null };
export type PemulanganDto = { disposisi: DisposisiPulang; kondisi_pulang: string; diagnosis_akhir: string; ringkasan: string; tindak_lanjut: string | null; waktu: string; dibuat_oleh_nama: string | null };
export type RawatInapDto = {
  kunjungan: { id: number; pasien_id: number; pasien_nama: string; pasien_nomor_rm: string; status: string; tahap_layanan: string; cara_pembayaran: 'umum' | 'jkn'; mulai: string; spri: string | null };
  penempatan: PenempatanDto[];
  dpjp: { id: number; nama: string; tipe: 'ATND' | 'SPRF' }[];
  pemulangan: PemulanganDto | null;
};
export type CatatanHarianDto = {
  id: number; subjektif: string; objektif: string; asesmen: string; rencana: string; instruksi: string | null; tanda_vital: TandaVitalIsi | null; dibuat_oleh_nama: string | null; waktu: string;
  pengesahan: PengesahanDto | null; verifikasi: StatusPengesahan;
};
export type HasilAdmisiDto = { kunjungan_id: number; menunggu_ruangan: boolean };
export type HasilPemulanganDto = { pemulangan: PemulanganDto; resume_dibuat: boolean; tagihan_kamar: number };
