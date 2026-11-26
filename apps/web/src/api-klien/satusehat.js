import { panggilApi } from './klien.js';
export const ambilKonfigurasiSatusehat = () => panggilApi('GET', '/satusehat/konfigurasi');
export const ujiSatusehat = () => panggilApi('POST', '/satusehat/konfigurasi/uji');
/** Cari ulang IHS Number satu pasien (mis. setelah NIK diperbaiki atau koneksi dipulihkan). */
export const cariUlangIhsPasien = (pasienId) => panggilApi('POST', `/satusehat/pasien/${pasienId}/ihs`);
export const kirimKunjunganSatusehat = (kunjunganId) => panggilApi('POST', `/satusehat/kunjungan/${kunjunganId}/kirim`, {});
export const pantauIntegrasi = ({ tanggal, cari, layanan, status } = {}) => {
    const q = new URLSearchParams(Object.entries({ tanggal, cari, layanan, status }).filter(([, v]) => Boolean(v))).toString();
    return panggilApi('GET', `/integrasi/sinkronisasi${q ? `?${q}` : ''}`);
};
