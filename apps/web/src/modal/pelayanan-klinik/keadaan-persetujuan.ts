import { PERSETUJUAN_TINDAKAN } from '@klira/shared';
import type { PersetujuanSiapDto, PersetujuanTindakanKirim } from '@klira/shared';

/** Keadaan Persetujuan tindakan (MODAL-BERTAHAP: Tindakan > Penjelasan > Persetujuan > Ringkasan). */
export type KeadaanPersetujuan = {
  /** '' belum dipilih, 'manual' tindakan diketik, selain itu kode tindakan kunjungan. */
  pilih: string;
  kode: string;
  nama: string;
  penjelasan: string;
  bentuk: 'tertulis' | 'lisan';
  penandatangan: 'pasien' | 'wali';
  wali: string;
  saksi: string;
};

export const PILIHAN_MANUAL = 'manual';

/** Pasien tidak cakap hanya dapat diwakili wali; tindakan tunggal kunjungan langsung terpilih. */
export function awalPersetujuan(siap: PersetujuanSiapDto | null): KeadaanPersetujuan {
  const satu = siap && siap.tindakan.length === 1 ? siap.tindakan[0] : null;
  return {
    pilih: satu?.kode ?? '', kode: satu?.kode ?? '', nama: satu?.nama ?? '', penjelasan: '', bentuk: 'tertulis', penandatangan: siap?.pasien.tidak_cakap ? 'wali' : 'pasien',
    wali: siap && siap.wali.length === 1 ? String(siap.wali[0].id) : '', saksi: '',
  };
}

/** Memilih tindakan dari daftar kunjungan menyalin kode dan namanya; "manual" mengosongkan agar diketik. */
export function pilihTindakan(k: KeadaanPersetujuan, siap: PersetujuanSiapDto, pilih: string): KeadaanPersetujuan {
  if (pilih === PILIHAN_MANUAL || !pilih) return { ...k, pilih, kode: '', nama: '' };
  const t = siap.tindakan.find((x) => x.kode === pilih);
  return { ...k, pilih, kode: t?.kode ?? '', nama: t?.nama ?? '' };
}

export const LANGKAH_PERSETUJUAN = ['tindakan', 'penjelasan', 'persetujuan'] as const;

/** Galat per bidang menurut langkahnya; kunci galat = nama bidang. */
export function galatPersetujuan(k: KeadaanPersetujuan, siap: PersetujuanSiapDto | null): Record<string, string> {
  const g: Record<string, string> = {};
  const G = PERSETUJUAN_TINDAKAN.galat;
  if (!siap?.teks) g.teks = G.pilihTeks;
  if (!k.nama.trim()) g.nama = G.tindakanWajib;
  if (k.kode.trim() && !/^\d{2}(\.\d{1,2})?$/.test(k.kode.trim())) g.kode = G.kode;
  if (!k.penjelasan.trim()) g.penjelasan = G.penjelasanWajib;
  if (k.penandatangan === 'wali' && !k.wali) g.wali = siap && !siap.wali.length ? G.waliTidakAda : G.waliWajib;
  if (siap?.pasien.tidak_cakap && k.penandatangan !== 'wali') g.penandatangan = PERSETUJUAN_TINDAKAN.persetujuan.tidakCakap;
  if (!k.saksi) g.saksi = G.saksiWajib;
  return g;
}

/** Indeks langkah pertama yang bermasalah (0 tindakan, 1 penjelasan, 2 persetujuan) atau -1. */
export function langkahBermasalahPersetujuan(g: Record<string, string>): number {
  if (g.nama || g.kode) return 0;
  if (g.penjelasan) return 1;
  if (g.wali || g.saksi || g.penandatangan || g.teks) return 2;
  return -1;
}

export function bentukPersetujuan(k: KeadaanPersetujuan, siap: PersetujuanSiapDto): PersetujuanTindakanKirim {
  return {
    tindakan_kode: k.kode.trim() || null, tindakan_nama: k.nama.trim(), penjelasan: k.penjelasan.trim(), bentuk: k.bentuk, penandatangan: k.penandatangan,
    wali_id: k.penandatangan === 'wali' ? Number(k.wali) : null, saksi_pengguna_id: Number(k.saksi), teks_persetujuan_id: siap.teks?.id ?? 0,
  };
}
