import { panggilApi } from './klien.js';
export const ambilPengaturanAntreanJkn = () => panggilApi('GET', '/antrean-jkn/pengaturan');
export const simpanPengaturanAntreanJkn = (m) => panggilApi('PUT', '/antrean-jkn/pengaturan', m);
/** Tarik pendaftaran Mobile JKN dari PCare; `paksa` melewati batas jarak penarikan di server. */
export const tarikPendaftaranJkn = (paksa = false) => panggilApi('POST', '/antrean-jkn/tarik', { paksa });
