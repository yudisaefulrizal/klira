import { panggilApi } from './klien.js';
export const opsiKunjungan = () => panggilApi('GET', '/kunjungan/opsi');
export const daftarkanKunjungan = (m) => panggilApi('POST', '/kunjungan', m);
/** Mengubah dokter tujuan (DPJP) selama pasien belum diperiksa dokter. */
export const ubahDpjpKunjungan = (id, dpjp_id) => panggilApi('PATCH', `/kunjungan/${id}/dpjp`, { dpjp_id });
/** Panggil, mulai, selesai, atau batalkan antrean. */
export const aksiAntrean = (id, aksi) => panggilApi('POST', `/antrean/${id}/${aksi}`);
/** Status sesi antrean saat ini (buka/tutup) dan daftar antrean sementara Mobile JKN. */
export const sesiAntrean = () => panggilApi('GET', '/antrean/sesi');
/** Membuka sesi antrean baru dan memindahkan antrean sementara Mobile JKN ke antrean aktif. */
export const bukaAntrean = () => panggilApi('POST', '/antrean/buka');
/** Menutup sesi antrean aktif (ditolak bila masih ada antrean belum selesai). */
export const tutupAntrean = () => panggilApi('POST', '/antrean/tutup');
