import { panggilApi } from './klien.js';
export const opsiKunjungan = () => panggilApi('GET', '/kunjungan/opsi');
export const daftarkanKunjungan = (m) => panggilApi('POST', '/kunjungan', m);
/** Mengubah dokter tujuan (DPJP) selama pasien belum diperiksa dokter. */
export const ubahDpjpKunjungan = (id, dpjp_id) => panggilApi('PATCH', `/kunjungan/${id}/dpjp`, { dpjp_id });
/** Panggil, mulai, selesai, atau batalkan antrean. */
export const aksiAntrean = (id, aksi) => panggilApi('POST', `/antrean/${id}/${aksi}`);
