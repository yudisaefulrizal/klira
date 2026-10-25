import type { StatusPembayaran, StatusTagihan } from '../status';

/** Tagihan dasar per kunjungan (4.5); dipakai kasir nanti. Status tagihan terpisah dari status pembayaran. */
export type ItemTagihanDto = {
  id: number; jenis: 'konsultasi' | 'tindakan' | 'lab' | 'kamar' | 'obat'; kode: string; nama: string; jumlah: number; harga: number | null; order_penunjang_id: number | null;
  item_resep_id?: number | null;
};
export type TagihanDto = {
  id: number | null;
  kunjungan_id: number;
  status_tagihan: StatusTagihan;
  status_pembayaran: StatusPembayaran;
  total: number;
  item: ItemTagihanDto[];
  /** Jumlah yang sudah dibayar dan sisa tagihan (0 bila lunas). */
  dibayar?: number;
  sisa?: number;
  pembayaran?: PembayaranDto[];
  alasan_tutup_belum_lunas?: string | null;
};
export type PembayaranDto = { id: number; metode: 'tunai' | 'transfer' | 'qris'; jumlah: number; waktu: string; kasir_nama: string | null };
