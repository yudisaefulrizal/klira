import { panggilApi } from './klien.js';
export const ambilKonfigurasiSatusehat = () => panggilApi('GET', '/satusehat/konfigurasi');
export const simpanKonfigurasiSatusehat = (m) => panggilApi('PUT', '/satusehat/konfigurasi', m);
export const aktifkanSatusehat = (environment) => panggilApi('POST', `/satusehat/konfigurasi/${environment}/aktifkan`);
export const ujiSatusehat = (environment) => panggilApi('POST', `/satusehat/konfigurasi/${environment}/uji`);
/** Cari ulang IHS Number satu pasien (mis. setelah NIK diperbaiki atau koneksi dipulihkan). */
export const cariUlangIhsPasien = (pasienId) => panggilApi('POST', `/satusehat/pasien/${pasienId}/ihs`);
