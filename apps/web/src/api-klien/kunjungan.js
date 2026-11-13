import { panggilApi } from './klien.js';
export const opsiKunjungan = () => panggilApi('GET', '/kunjungan/opsi');
export const daftarkanKunjungan = (m) => panggilApi('POST', '/kunjungan', m);
/** Panggil, mulai, selesai, atau batalkan antrean. */
export const aksiAntrean = (id, aksi) => panggilApi('POST', `/antrean/${id}/${aksi}`);
