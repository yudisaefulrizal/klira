import { z } from 'zod';
import { KASIR } from '../teks';
import type { CaraPembayaran, MetodeBayar } from '../status';
import { teksOpsional } from './umum';
import type { PembayaranDto, TagihanDto } from './tagihan';
import type { ResepDto } from './farmasi';

const bulat = (maks: number, min = 0) =>
  z.preprocess((v) => (v === '' || v === null ? undefined : v), z.coerce.number({ error: KASIR.galat.angka }).int(KASIR.galat.angka).min(min, min > 0 ? KASIR.galat.jumlahMinimal : KASIR.galat.negatif).max(maks));
export const NILAI_METODE_BAYAR = ['tunai', 'transfer', 'qris'] as const;

export const MAKS_BARIS_BAYAR = 3;
const barisBayar = z.object({ metode: z.enum(NILAI_METODE_BAYAR, { error: KASIR.galat.metode }), jumlah: bulat(1_000_000_000, 1) });
/**
 * Pembayaran satu tagihan dengan 1 sampai 3 metode (metode tidak boleh ganda). Jumlah adalah yang DITERIMA per metode;
 * non-tunai total tidak boleh melebihi sisa (diperiksa server terhadap sisa terkini), kelebihan tunai menjadi kembalian.
 */
export const bayarMasukan = z
  .object({ pembayaran: z.array(barisBayar, { error: KASIR.galat.barisMinimal }).min(1, KASIR.galat.barisMinimal).max(MAKS_BARIS_BAYAR, KASIR.galat.barisMaksimal) })
  .superRefine((d, ctx) => {
    const terlihat = new Set<string>();
    d.pembayaran.forEach((b, i) => {
      if (terlihat.has(b.metode)) ctx.addIssue({ code: 'custom', path: ['pembayaran', i, 'metode'], message: KASIR.galat.metodeGanda });
      terlihat.add(b.metode);
    });
  });
export type BayarMasukan = z.input<typeof bayarMasukan>;
export type BarisBayar = { metode: MetodeBayar; jumlah: number };
/** Rincian penerapan pembayaran beberapa metode terhadap sisa tagihan. */
export type RincianBayar = { diterima: number; non_tunai: number; diterapkan: number; kembalian: number; non_tunai_lebih: boolean; per_baris: (BarisBayar & { diterapkan: number })[] };
/**
 * Non-tunai diterapkan penuh (totalnya wajib <= sisa); tunai diterapkan sebatas sisa setelah non-tunai, kelebihannya kembalian.
 * Kembalian hanya berasal dari tunai dan tidak dicatat sebagai pembayaran.
 */
export function rincianBayar(baris: BarisBayar[], sisa: number): RincianBayar {
  const nonTunai = baris.filter((b) => b.metode !== 'tunai').reduce((s, b) => s + b.jumlah, 0);
  const ruangTunai = Math.max(0, sisa - nonTunai);
  const tunai = baris.filter((b) => b.metode === 'tunai').reduce((s, b) => s + b.jumlah, 0);
  const tunaiDiterapkan = Math.min(tunai, ruangTunai);
  const per_baris = baris.map((b) => ({ ...b, diterapkan: b.metode === 'tunai' ? tunaiDiterapkan : b.jumlah }));
  return { diterima: nonTunai + tunai, non_tunai: nonTunai, diterapkan: nonTunai + tunaiDiterapkan, kembalian: tunai - tunaiDiterapkan, non_tunai_lebih: nonTunai > sisa, per_baris };
}

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
/** Tarif yang bisa ditambahkan kasir; harga sudah disesuaikan dengan cara pembayaran kunjungan (null: tindakan tanpa harga acuan, dilengkapi kasir). */
export type TarifKasirDto = { id: number; kode: string; nama: string; jenis: 'konsultasi' | 'tindakan' | 'lab' | 'kamar'; harga: number | null };

/** Ubah harga item tagihan per kunjungan (bukan obat) sebelum ada pembayaran; alasan wajib dan tercatat di audit. */
export const ubahHargaMasukan = z.object({
  harga: bulat(100_000_000),
  alasan: z.string({ error: KASIR.galat.alasanWajib }).trim().min(1, KASIR.galat.alasanWajib).max(300),
});
export type UbahHargaMasukan = z.input<typeof ubahHargaMasukan>;
/** Item yang boleh diubah harganya: bukan obat dan sudah berharga (item tanpa harga memakai Lengkapi harga). */
export const bolehUbahHarga = (i: { jenis: string; harga: number | null }): boolean => i.jenis !== 'obat' && i.harga !== null;
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
  kunjungan: { id: number; pasien_id: number; pasien_nama: string; pasien_nomor_rm: string; tahap_layanan: string; cara_pembayaran: CaraPembayaran };
  tagihan: TagihanDto & { pembayaran: PembayaranDto[]; dibayar: number; sisa: number };
  resep: ResepDto[];
  shift_terbuka: boolean;
  /** Tarif aktif yang bisa ditambahkan ke tagihan (tanpa obat: obat lewat resep agar stok tercatat). */
  tarif: TarifKasirDto[];
  syarat: SyaratTutupDto;
};
export type HasilSerahTerimaDto = { resep: ResepDto[]; kekurangan: { master_obat_id: number; nama: string; butuh: number; tersedia: number }[] };
/** `pembayaran`: baris yang dicatat (satu per metode, tunai sebesar yang diterapkan); `diterima` termasuk kembalian. */
export type HasilBayarDto = { pembayaran: PembayaranDto[]; tagihan: KasirKunjunganDto['tagihan']; diterima: number; diterapkan: number; kembalian: number };
