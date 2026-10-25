import type { StatusPembayaran, StatusTagihan } from '../status';

/** Tagihan dasar per kunjungan (4.5); dipakai kasir nanti. Status tagihan terpisah dari status pembayaran. */
export type ItemTagihanDto = {
  id: number; jenis: 'konsultasi' | 'tindakan' | 'lab' | 'kamar'; kode: string; nama: string; jumlah: number; harga: number | null; order_penunjang_id: number | null;
};
export type TagihanDto = {
  id: number | null;
  kunjungan_id: number;
  status_tagihan: StatusTagihan;
  status_pembayaran: StatusPembayaran;
  total: number;
  item: ItemTagihanDto[];
};
