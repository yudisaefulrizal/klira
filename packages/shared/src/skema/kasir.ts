import { z } from 'zod';
import { KASIR } from '../teks';
import type { MetodeBayar } from '../status';
import { teksOpsional } from './umum';
import type { PembayaranDto, TagihanDto } from './tagihan';
import type { ResepDto } from './farmasi';

const bulat = (maks: number, min = 0) =>
  z.preprocess((v) => (v === '' || v === null ? undefined : v), z.coerce.number({ error: KASIR.galat.angka }).int(KASIR.galat.angka).min(min, min > 0 ? KASIR.galat.jumlahMinimal : KASIR.galat.negatif).max(maks));
export const NILAI_METODE_BAYAR = ['tunai', 'transfer', 'qris'] as const;

/** Pembayaran: jumlah yang DITERIMA; yang diterapkan ke tagihan dibatasi sisa (kembalian tidak dicatat sebagai pembayaran). */
export const bayarMasukan = z.object({ metode: z.enum(NILAI_METODE_BAYAR, { error: KASIR.galat.metode }), jumlah: bulat(1_000_000_000, 1) });
export type BayarMasukan = z.input<typeof bayarMasukan>;

/** Serah terima obat: stok kurang hanya boleh dilanjutkan dengan persetujuan eksplisit dan alasan (Peringatan stok kurang, 3.2). */
export const serahTerimaMasukan = z
  .object({ izinkan_stok_kurang: z.boolean().default(false), alasan: teksOpsional(300) })
  .superRefine((d, ctx) => {
    if (d.izinkan_stok_kurang && !(d.alasan && d.alasan.trim())) ctx.addIssue({ code: 'custom', path: ['alasan'], message: KASIR.galat.alasanWajib });
  });
export type SerahTerimaMasukan = z.input<typeof serahTerimaMasukan>;

/** Tutup kunjungan: bila belum lunas, alasan wajib (peringatan, tercatat di audit). */
export const tutupKunjunganMasukan = z.object({ alasan: teksOpsional(300) });
export type TutupKunjunganMasukan = z.infer<typeof tutupKunjunganMasukan>;

export const bukaShiftMasukan = z.object({ kas_awal: bulat(1_000_000_000) });
export const tutupShiftMasukan = z.object({ kas_akhir: bulat(1_000_000_000), alasan_selisih: teksOpsional(300) });
export type BukaShiftMasukan = z.input<typeof bukaShiftMasukan>;
export type TutupShiftMasukan = z.input<typeof tutupShiftMasukan>;

export const filterRekap = z.object({ tanggal: z.preprocess((v) => (v === '' ? undefined : v), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, KASIR.galat.tanggal).optional()) });

export type ShiftDto = {
  id: number; kasir_id: number; kasir_nama: string | null; buka: string; tutup: string | null; kas_awal: number; kas_akhir: number | null; selisih: number | null; alasan_selisih: string | null;
  tunai: number; transfer: number; qris: number; jumlah_pembayaran: number; kas_seharusnya: number;
};
export type RekapHarianDto = { tanggal: string; per_metode: Record<MetodeBayar, number>; total: number; jumlah_pembayaran: number; shift: ShiftDto[] };
export type ShiftSayaDto = { terbuka: ShiftDto | null };

export type SyaratTutupDto = { tahap_kasir: boolean; tagihan_lengkap: boolean; resep_diserahkan: boolean; lunas: boolean };
/** Gambaran kasir satu kunjungan untuk modal Pembayaran dan serah terima obat serta Tutup kunjungan. */
export type KasirKunjunganDto = {
  kunjungan: { id: number; pasien_id: number; pasien_nama: string; pasien_nomor_rm: string; tahap_layanan: string; cara_pembayaran: 'umum' | 'jkn' };
  tagihan: TagihanDto & { pembayaran: PembayaranDto[]; dibayar: number; sisa: number };
  resep: ResepDto[];
  shift_terbuka: boolean;
  syarat: SyaratTutupDto;
};
export type HasilSerahTerimaDto = { resep: ResepDto[]; kekurangan: { master_obat_id: number; nama: string; butuh: number; tersedia: number }[] };
export type HasilBayarDto = { pembayaran: PembayaranDto; tagihan: KasirKunjunganDto['tagihan']; kembalian: number };
