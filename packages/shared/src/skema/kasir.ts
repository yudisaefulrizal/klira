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

/** Melengkapi harga item tagihan yang belum berharga (mis. pemeriksaan tanpa tarif). Harga yang sudah terisi tidak dapat diubah lewat jalur ini. */
export const lengkapiHargaMasukan = z.object({ harga: bulat(100_000_000) });

/** Kasir menambah item tagihan dari master tarif (konsultasi, visite, tindakan, kamar, lab); harga mengikuti tarif dan cara pembayaran. */
export const tambahItemTarifMasukan = z.object({ tarif_id: z.number({ error: KASIR.galat.pilihTarif }).int().positive(KASIR.galat.pilihTarif), jumlah: bulat(1000, 1) });
export type TambahItemTarifMasukan = z.input<typeof tambahItemTarifMasukan>;
/** Tarif yang bisa ditambahkan kasir; harga sudah disesuaikan dengan cara pembayaran kunjungan. */
export type TarifKasirDto = { id: number; kode: string; nama: string; jenis: 'konsultasi' | 'tindakan' | 'lab' | 'kamar'; harga: number };
export type LengkapiHargaMasukan = z.input<typeof lengkapiHargaMasukan>;

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

/** `ditanggung_jkn`: kunjungan JKN boleh ditutup tanpa pembayaran dan tanpa alasan (biaya diklaim ke BPJS). */
export type SyaratTutupDto = { tahap_kasir: boolean; tagihan_lengkap: boolean; resep_diserahkan: boolean; lunas: boolean; ditanggung_jkn: boolean };
/** Gambaran kasir satu kunjungan untuk pembayaran dan syarat tutup kunjungan; resep hanya sebagai status pendamping. */
export type KasirKunjunganDto = {
  kunjungan: { id: number; pasien_id: number; pasien_nama: string; pasien_nomor_rm: string; tahap_layanan: string; cara_pembayaran: 'umum' | 'jkn' };
  tagihan: TagihanDto & { pembayaran: PembayaranDto[]; dibayar: number; sisa: number };
  resep: ResepDto[];
  shift_terbuka: boolean;
  /** Tarif aktif yang bisa ditambahkan ke tagihan (tanpa obat: obat lewat resep agar stok tercatat). */
  tarif: TarifKasirDto[];
  syarat: SyaratTutupDto;
};
export type HasilSerahTerimaDto = { resep: ResepDto[]; kekurangan: { master_obat_id: number; nama: string; butuh: number; tersedia: number }[] };
export type HasilBayarDto = { pembayaran: PembayaranDto; tagihan: KasirKunjunganDto['tagihan']; kembalian: number };
