import { admisiMasukan, catatanHarianMasukan, pemulanganMasukan, penempatanMasukan, TANDA_VITAL } from '@klira/shared';
import type { AdmisiForm, CatatanHarianForm, KelasRawat, PemulanganForm, PenempatanForm, RawatInapDto } from '@klira/shared';

type Isu = { path: PropertyKey[]; message: string };
const petakan = (isu: readonly Isu[] | undefined): Record<string, string> => {
  const g: Record<string, string> = {};
  for (const i of isu ?? []) g[i.path.map(String).join('.') || ''] ??= i.message;
  return g;
};
const idAtauNull = (v: string): number | null => (v ? Number(v) : null);

// ---- Admisi (MODAL-BERTAHAP: Pasien > Ruang dan kelas > DPJP > SPRI > Ringkasan) ----
export type KeadaanAdmisi = {
  pasien_id: number | null; bed_id: string; kelas: KelasRawat; indikator: 'kelas_tetap' | 'naik_kelas' | 'turun_kelas' | 'titip_rawat'; tarif_id: string; dpjp_id: string; dpjp_bersama: string[]; spri: string; keluhan_singkat: string;
  cara_pembayaran: 'umum' | 'jkn';
};
export const awalAdmisi = (): KeadaanAdmisi => ({ pasien_id: null, bed_id: '', kelas: 'tiga', indikator: 'kelas_tetap', tarif_id: '', dpjp_id: '', dpjp_bersama: [], spri: '', keluhan_singkat: '', cara_pembayaran: 'umum' });
export const bentukAdmisi = (k: KeadaanAdmisi): AdmisiForm => ({
  pasien_id: k.pasien_id ?? 0, bed_id: idAtauNull(k.bed_id), kelas: k.kelas, indikator: k.indikator, tarif_id: idAtauNull(k.tarif_id), dpjp_id: Number(k.dpjp_id) || 0,
  dpjp_bersama: k.dpjp_bersama.map(Number), spri: k.spri, keluhan_singkat: k.keluhan_singkat, cara_pembayaran: k.cara_pembayaran,
});
export const galatAdmisi = (k: KeadaanAdmisi): Record<string, string> => petakan(admisiMasukan.safeParse(bentukAdmisi(k)).error?.issues);
/** Isi spri dari kunjungan rawat jalan asal hanya bila belum diisi. */
export const isiSpriAsal = (k: KeadaanAdmisi, spri: string | null): KeadaanAdmisi => (k.spri || !spri ? k : { ...k, spri });
/** Indeks langkah pertama bermasalah (0 pasien, 1 ruang dan kelas, 2 DPJP) atau -1. */
export function langkahBermasalahAdmisi(g: Record<string, string>): number {
  if (g.pasien_id) return 0;
  if (g.bed_id || g.kelas || g.indikator || g.tarif_id) return 1;
  if (g.dpjp_id || g.dpjp_bersama) return 2;
  return -1;
}

// ---- Ubah penempatan ----
export type KeadaanPenempatan = { bed_id: string; kelas: KelasRawat; indikator: KeadaanAdmisi['indikator']; tarif_id: string; dpjp_id: string; dpjp_bersama: string[]; alasan: string };
export function awalPenempatan(d: RawatInapDto | null): KeadaanPenempatan {
  const aktif = d?.penempatan.find((x) => !x.selesai);
  return {
    bed_id: '', kelas: aktif?.kelas ?? 'tiga', indikator: aktif?.indikator ?? 'kelas_tetap', tarif_id: aktif?.tarif_id ? String(aktif.tarif_id) : '', dpjp_id: String(d?.dpjp.find((x) => x.tipe === 'ATND')?.id ?? ''),
    dpjp_bersama: (d?.dpjp.filter((x) => x.tipe === 'SPRF') ?? []).map((x) => String(x.id)), alasan: '',
  };
}
export const bentukPenempatan = (k: KeadaanPenempatan): PenempatanForm => ({
  bed_id: idAtauNull(k.bed_id), kelas: k.kelas, indikator: k.indikator, tarif_id: idAtauNull(k.tarif_id), dpjp_id: Number(k.dpjp_id) || 0, dpjp_bersama: k.dpjp_bersama.map(Number), alasan: k.alasan,
});
export const galatPenempatan = (k: KeadaanPenempatan): Record<string, string> => petakan(penempatanMasukan.safeParse(bentukPenempatan(k)).error?.issues);

// ---- Catatan harian ----
export type KeadaanCatatan = { subjektif: string; objektif: string; asesmen: string; rencana: string; instruksi: string; tanda_vital: Record<string, string> };
export const awalCatatan = (): KeadaanCatatan => ({ subjektif: '', objektif: '', asesmen: '', rencana: '', instruksi: '', tanda_vital: Object.fromEntries(TANDA_VITAL.map((t) => [t.kunci, ''])) });
const adaTandaVital = (k: KeadaanCatatan) => Object.values(k.tanda_vital).some((v) => v.trim() !== '');
export const bentukCatatan = (k: KeadaanCatatan): CatatanHarianForm => ({
  subjektif: k.subjektif, objektif: k.objektif, asesmen: k.asesmen, rencana: k.rencana, instruksi: k.instruksi, tanda_vital: adaTandaVital(k) ? (k.tanda_vital as unknown as CatatanHarianForm['tanda_vital']) : null,
});
export const galatCatatan = (k: KeadaanCatatan): Record<string, string> => petakan(catatanHarianMasukan.safeParse(bentukCatatan(k)).error?.issues);

// ---- Pemulangan (MODAL-BERTAHAP: Ringkasan > Diagnosis akhir > Kondisi pulang > Tindak lanjut > Resume medis) ----
export type KeadaanPulang = { ringkasan: string; diagnosis_akhir: string; terapi: string; disposisi: PemulanganForm['disposisi'] | ''; kondisi_pulang: string; tindak_lanjut: string; buat_resume: boolean };
export const awalPulang = (): KeadaanPulang => ({ ringkasan: '', diagnosis_akhir: '', terapi: '', disposisi: 'home', kondisi_pulang: '', tindak_lanjut: '', buat_resume: true });
export const bentukPulang = (k: KeadaanPulang): PemulanganForm => ({ ...k, disposisi: k.disposisi as PemulanganForm['disposisi'] });
export const galatPulang = (k: KeadaanPulang): Record<string, string> => petakan(pemulanganMasukan.safeParse(bentukPulang(k)).error?.issues);
export function langkahBermasalahPulang(g: Record<string, string>): number {
  if (g.ringkasan) return 0;
  if (g.diagnosis_akhir) return 1;
  if (g.disposisi || g.kondisi_pulang) return 2;
  return -1;
}
