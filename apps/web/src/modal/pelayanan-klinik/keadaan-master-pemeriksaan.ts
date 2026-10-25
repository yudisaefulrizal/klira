import { masterPemeriksaanMasukan } from '@klira/shared';
import type { MasterPemeriksaanDto } from '@klira/shared';

/** Keadaan formulir Master pemeriksaan (MODAL-1): semuanya teks agar mudah diisi, divalidasi dengan skema bersama. */
export type KeadaanMasterPemeriksaan = {
  kode: string; nama: string; kode_loinc: string; jenis_spesimen: string; satuan: string; rujukan_min: string; rujukan_maks: string; rujukan_teks: string; tarif_layanan_id: string; aktif: boolean;
};

export const awalMasterPemeriksaan = (m?: MasterPemeriksaanDto): KeadaanMasterPemeriksaan => ({
  kode: m?.kode ?? '', nama: m?.nama ?? '', kode_loinc: m?.kode_loinc ?? '', jenis_spesimen: m?.jenis_spesimen ?? '', satuan: m?.satuan ?? '',
  rujukan_min: m?.rujukan_min != null ? String(m.rujukan_min) : '', rujukan_maks: m?.rujukan_maks != null ? String(m.rujukan_maks) : '', rujukan_teks: m?.rujukan_teks ?? '',
  tarif_layanan_id: m?.tarif ? String(m.tarif.id) : '', aktif: m?.aktif ?? true,
});

/** Isian menjadi bentuk kiriman (kosong dibiarkan; skema bersama menormalkan menjadi null). */
export const bentukMasterPemeriksaan = (k: KeadaanMasterPemeriksaan): Record<string, unknown> => ({ ...k });

/** Galat per bidang dari skema bersama (pesan sama dengan API). */
export function galatMasterPemeriksaan(k: KeadaanMasterPemeriksaan): Record<string, string> {
  const h = masterPemeriksaanMasukan.safeParse(bentukMasterPemeriksaan(k));
  if (h.success) return {};
  const g: Record<string, string> = {};
  for (const i of h.error.issues) g[String(i.path[0] ?? '')] ??= i.message;
  return g;
}

/** Hanya bidang yang berubah dikirim saat mengubah (PATCH). */
export function perubahanMaster(awal: KeadaanMasterPemeriksaan, k: KeadaanMasterPemeriksaan): Record<string, unknown> {
  const hasil: Record<string, unknown> = {};
  for (const kunci of Object.keys(k) as (keyof KeadaanMasterPemeriksaan)[]) if (k[kunci] !== awal[kunci]) hasil[kunci] = k[kunci];
  return hasil;
}
