import { panggilApi } from './klien.js';
export const ambilKonfigurasiPcare = () => panggilApi('GET', '/pcare/konfigurasi');
export const simpanKonfigurasiPcare = (m) => panggilApi('PUT', '/pcare/konfigurasi', m);
export const aktifkanPcare = (environment) => panggilApi('POST', `/pcare/konfigurasi/${environment}/aktifkan`);
export const ujiPcare = (environment) => panggilApi('POST', `/pcare/konfigurasi/${environment}/uji`);
export const cekPesertaPcare = (nomor, jenis = 'noka') => panggilApi('GET', `/pcare/peserta?nomor=${encodeURIComponent(nomor)}&jenis=${encodeURIComponent(jenis)}`);
export const referensiPcare = (jenis, params = {}) => {
    const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')).toString();
    return panggilApi('GET', `/pcare/referensi/${encodeURIComponent(jenis)}${q ? `?${q}` : ''}`);
};
export const daftarPemetaanPcare = (jenis) => panggilApi('GET', `/pcare/pemetaan${jenis ? `?jenis=${encodeURIComponent(jenis)}` : ''}`);
export const simpanPemetaanPcare = (m) => panggilApi('PUT', '/pcare/pemetaan', m);
export const hapusPemetaanPcare = (m) => panggilApi('DELETE', '/pcare/pemetaan', m);
export const kirimKunjunganPcare = (kunjunganId, opsi = {}) => panggilApi('POST', `/pcare/kunjungan/${kunjunganId}/kirim`, opsi);
