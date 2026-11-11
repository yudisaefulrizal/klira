import type { BayarMasukan, HasilBayarDto, KasirKunjunganDto, RekapHarianDto, ShiftDto, ShiftSayaDto } from '@klira/shared';
import { panggilApi } from './klien';

export const shiftSaya = () => panggilApi<ShiftSayaDto>('GET', '/kasir/shift');
export const bukaShift = (m: Record<string, unknown>) => panggilApi<ShiftDto>('POST', '/kasir/shift/buka', m);
export const tutupShift = (m: Record<string, unknown>) => panggilApi<ShiftDto>('POST', '/kasir/shift/tutup', m);
export const rekapHarian = (tanggal?: string) => panggilApi<RekapHarianDto>('GET', `/kasir/rekap${tanggal ? `?${new URLSearchParams({ tanggal }).toString()}` : ''}`);
export const kasirKunjungan = (kunjunganId: number) => panggilApi<KasirKunjunganDto>('GET', `/kunjungan/${kunjunganId}/kasir`);
/** Satu tagihan dibayar 1-3 metode dalam satu permintaan (satu transaksi di server). */
export const catatPembayaran = (kunjunganId: number, m: BayarMasukan) => panggilApi<HasilBayarDto>('POST', `/kunjungan/${kunjunganId}/pembayaran`, m);
export const tutupKunjungan = (kunjunganId: number, m: Record<string, unknown> = {}) => panggilApi<KasirKunjunganDto>('POST', `/kunjungan/${kunjunganId}/tutup`, m);
export const tambahItemTagihan = (kunjunganId: number, tarif_id: number, jumlah: number) => panggilApi<KasirKunjunganDto>('POST', `/kunjungan/${kunjunganId}/tagihan/item`, { tarif_id, jumlah });
export const hapusItemTagihan = (kunjunganId: number, itemId: number) => panggilApi<KasirKunjunganDto>('DELETE', `/kunjungan/${kunjunganId}/tagihan/item/${itemId}`);
export const ubahHargaItem = (kunjunganId: number, itemId: number, harga: string, alasan: string) =>
  panggilApi<KasirKunjunganDto>('POST', `/kunjungan/${kunjunganId}/tagihan/item/${itemId}/ubah-harga`, { harga, alasan });
export const lengkapiHargaItem = (kunjunganId: number, itemId: number, harga: string) => panggilApi<KasirKunjunganDto>('POST', `/kunjungan/${kunjunganId}/tagihan/item/${itemId}/harga`, { harga });
