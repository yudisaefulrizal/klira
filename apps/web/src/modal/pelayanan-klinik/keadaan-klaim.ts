import { berkasKurang, siapkanKlaimMasukan, ubahBerkasKlaimMasukan, ubahStatusKlaimMasukan } from '@klira/shared';
import type { AksiKlaim, BerkasKlaim, KandidatKlaimDto, KlaimDto, SiapkanKlaimForm, UbahBerkasKlaimForm, UbahStatusKlaimForm } from '@klira/shared';

type Isu = { path: PropertyKey[]; message: string };
const petakan = (isu: readonly Isu[] | undefined): Record<string, string> => {
  const g: Record<string, string> = {};
  for (const i of isu ?? []) g[i.path.map(String).join('.') || ''] ??= i.message;
  return g;
};

// ---- Penyiapan klaim (MODAL-BERTAHAP: Kunjungan dan SEP > Diagnosis dan tindakan > Berkas klaim > Ringkasan) ----
export type KeadaanKlaim = { kunjungan_id: number | null; nomor_sep: string; berkas: BerkasKlaim[]; catatan: string };
export const awalKlaim = (klaim?: KlaimDto | null): KeadaanKlaim => ({ kunjungan_id: klaim?.kunjungan_id ?? null, nomor_sep: klaim?.nomor_sep ?? '', berkas: klaim?.berkas ?? [], catatan: klaim?.catatan ?? '' });
export const bentukSiapkan = (k: KeadaanKlaim): SiapkanKlaimForm => ({ kunjungan_id: k.kunjungan_id ?? 0, nomor_sep: k.nomor_sep, berkas: k.berkas, catatan: k.catatan });
export const bentukUbahBerkas = (k: KeadaanKlaim): UbahBerkasKlaimForm => ({ nomor_sep: k.nomor_sep, berkas: k.berkas, catatan: k.catatan });
export const galatKlaim = (k: KeadaanKlaim, ubah: boolean): Record<string, string> =>
  petakan((ubah ? ubahBerkasKlaimMasukan.safeParse(bentukUbahBerkas(k)) : siapkanKlaimMasukan.safeParse(bentukSiapkan(k))).error?.issues);
/** Pilih kunjungan kandidat: nomor SEP dari kunjungan ikut terisi bila belum diketik. */
export const pilihKandidat = (k: KeadaanKlaim, kandidat: KandidatKlaimDto | undefined): KeadaanKlaim => ({ ...k, kunjungan_id: kandidat?.kunjungan_id ?? null, nomor_sep: k.nomor_sep || kandidat?.nomor_sep || '' });
/** Pindah satu berkas masuk atau keluar dari daftar lengkap (urutan mengikuti katalog). */
export function alihBerkas(k: KeadaanKlaim, berkas: BerkasKlaim, lengkap: boolean, urutan: readonly BerkasKlaim[]): KeadaanKlaim {
  const set = new Set(k.berkas);
  if (lengkap) set.add(berkas);
  else set.delete(berkas);
  return { ...k, berkas: urutan.filter((b) => set.has(b)) };
}
export const kurangBerkas = (jenis: 'AMB' | 'IMP', k: KeadaanKlaim): BerkasKlaim[] => berkasKurang(jenis, k.berkas);
/** Indeks langkah pertama bermasalah (0 kunjungan dan SEP, 2 berkas) atau -1. */
export function langkahBermasalahKlaim(g: Record<string, string>): number {
  if (g.kunjungan_id || g.nomor_sep) return 0;
  if (g.berkas || g.catatan) return 2;
  return -1;
}

// ---- Ubah status ----
export type KeadaanStatusKlaim = { aksi: AksiKlaim | ''; berita_acara: string; alasan: string; jumlah_dibayar: string; dibayar_pada: string };
export const awalStatusKlaim = (aksi: AksiKlaim | '' = '', hariIni = ''): KeadaanStatusKlaim => ({ aksi, berita_acara: '', alasan: '', jumlah_dibayar: '', dibayar_pada: hariIni });
export const bentukStatusKlaim = (k: KeadaanStatusKlaim): UbahStatusKlaimForm => ({ ...k, aksi: k.aksi as AksiKlaim });
export const galatStatusKlaim = (k: KeadaanStatusKlaim): Record<string, string> => petakan(ubahStatusKlaimMasukan.safeParse(bentukStatusKlaim(k)).error?.issues);
