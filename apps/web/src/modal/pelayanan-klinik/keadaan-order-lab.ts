import { hargaTarif } from '@klira/shared';
import type { MasterPemeriksaanDto, OrderLabKirim, PrioritasOrder } from '@klira/shared';
import { PENUNJANG } from '@klira/shared';

/** Keadaan formulir Order lab (MODAL-1 dan langkah Order penunjang): pemeriksaan terpilih, prioritas, catatan. */
export type KeadaanOrderLab = { pemeriksaan: number[]; prioritas: PrioritasOrder; catatan: string };
export const awalOrderLab = (): KeadaanOrderLab => ({ pemeriksaan: [], prioritas: 'rutin', catatan: '' });

/** Pemeriksaan aktif yang cocok dengan kata cari (nama, kode, atau LOINC), urut nama. */
export function saringPemeriksaan(master: readonly MasterPemeriksaanDto[], cari: string): MasterPemeriksaanDto[] {
  const k = cari.trim().toLowerCase();
  if (!k) return [];
  return master
    .filter((m) => m.aktif && (m.nama.toLowerCase().includes(k) || m.kode.toLowerCase().includes(k) || (m.kode_loinc ?? '').toLowerCase().includes(k)))
    .sort((a, b) => a.nama.localeCompare(b.nama, 'id'));
}

/** Menambah atau melepas satu pemeriksaan dari pilihan (urutan pilih dipertahankan). */
export const gantiPilihan = (k: KeadaanOrderLab, id: number): KeadaanOrderLab => ({
  ...k, pemeriksaan: k.pemeriksaan.includes(id) ? k.pemeriksaan.filter((x) => x !== id) : [...k.pemeriksaan, id],
});

export const galatOrderLab = (k: KeadaanOrderLab): string | null => (k.pemeriksaan.length ? null : PENUNJANG.galat.pilihPemeriksaan);

export const bentukOrderLab = (k: KeadaanOrderLab): OrderLabKirim => ({
  pemeriksaan_ids: k.pemeriksaan, prioritas: k.prioritas, catatan: k.catatan.trim() || null,
});

/** Perkiraan biaya pemeriksaan terpilih menurut cara pembayaran kunjungan; `tanpaTarif` bila ada yang belum bertarif. */
export function perkiraanBiaya(master: readonly MasterPemeriksaanDto[], terpilih: readonly number[], cara: 'umum' | 'jkn'): { total: number; tanpaTarif: number } {
  let total = 0;
  let tanpaTarif = 0;
  for (const id of terpilih) {
    const harga = hargaTarif(master.find((m) => m.id === id)?.tarif ?? null, cara);
    if (harga === null) tanpaTarif += 1;
    else total += harga;
  }
  return { total, tanpaTarif };
}

/** Rupiah untuk tampilan (tanpa pecahan). */
export const rupiah = (n: number): string => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
