import { panggilApi } from './klien.js';
export const shiftSaya = () => panggilApi('GET', '/kasir/shift');
export const bukaShift = (m) => panggilApi('POST', '/kasir/shift/buka', m);
export const tutupShift = (m) => panggilApi('POST', '/kasir/shift/tutup', m);
export const rekapHarian = (tanggal) => panggilApi('GET', `/kasir/rekap${tanggal ? `?${new URLSearchParams({ tanggal }).toString()}` : ''}`);
export const kasirKunjungan = (kunjunganId) => panggilApi('GET', `/kunjungan/${kunjunganId}/kasir`);
/** Satu tagihan dibayar 1-3 metode dalam satu permintaan (satu transaksi di server). */
export const catatPembayaran = (kunjunganId, m) => panggilApi('POST', `/kunjungan/${kunjunganId}/pembayaran`, m);
export const tutupKunjungan = (kunjunganId, m = {}) => panggilApi('POST', `/kunjungan/${kunjunganId}/tutup`, m);
export const tambahItemTagihan = (kunjunganId, tarif_id, jumlah) => panggilApi('POST', `/kunjungan/${kunjunganId}/tagihan/item`, { tarif_id, jumlah });
export const hapusItemTagihan = (kunjunganId, itemId) => panggilApi('DELETE', `/kunjungan/${kunjunganId}/tagihan/item/${itemId}`);
export const ubahHargaItem = (kunjunganId, itemId, harga, alasan) => panggilApi('POST', `/kunjungan/${kunjunganId}/tagihan/item/${itemId}/ubah-harga`, { harga, alasan });
export const lengkapiHargaItem = (kunjunganId, itemId, harga) => panggilApi('POST', `/kunjungan/${kunjunganId}/tagihan/item/${itemId}/harga`, { harga });
