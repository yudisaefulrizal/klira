import { panggilApi } from './klien.js';
export const ambilKonfigurasiPcare = () => panggilApi('GET', '/pcare/konfigurasi');
export const simpanKonfigurasiPcare = (m) => panggilApi('PUT', '/pcare/konfigurasi', m);
export const aktifkanPcare = (environment) => panggilApi('POST', `/pcare/konfigurasi/${environment}/aktifkan`);
export const ujiPcare = (environment) => panggilApi('POST', `/pcare/konfigurasi/${environment}/uji`);
