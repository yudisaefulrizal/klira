import { panggilApi } from './klien.js';
export const ambilKlinis = (kunjunganId) => panggilApi('GET', `/kunjungan/${kunjunganId}/klinis`);
/** Rekam medis rawat jalan satu kunjungan untuk dicetak (tercatat di audit). */
export const ambilRekamMedisCetak = (kunjunganId) => panggilApi('GET', `/kunjungan/${kunjunganId}/rekam-medis-cetak`);
export const ambilKonteksKlinis = (kunjunganId) => panggilApi('GET', `/kunjungan/${kunjunganId}/konteks-klinis`);
/** Simpan satu bagian = pengesahan; `alasan` wajib bila bagian itu sudah disahkan. */
export const simpanBagian = (kunjunganId, bagian, isi, alasan) => panggilApi('PUT', `/kunjungan/${kunjunganId}/klinis/${bagian}`, { isi, ...(alasan?.trim() ? { alasan: alasan.trim() } : {}) });
export const selesaikanPemeriksaan = (kunjunganId, tahap = 'kasir') => panggilApi('POST', `/kunjungan/${kunjunganId}/klinis/selesai`, { tahap });
export const riwayatKunjungan = (pasienId, kecualiKunjunganId) => panggilApi('GET', `/pasien/${pasienId}/riwayat-kunjungan${kecualiKunjunganId ? `?kecuali=${kecualiKunjunganId}` : ''}`);
export const salinanKunjungan = (kunjunganId, sumberId) => panggilApi('GET', `/kunjungan/${kunjunganId}/salinan/${sumberId}`);
export const cariTerminologi = (sistem, q, batas = 10) => panggilApi('GET', `/terminologi?${new URLSearchParams({ sistem, q, batas: String(batas) }).toString()}`);
/** Daftar tindakan klinik (tarif tindakan aktif) untuk langkah Tindakan. */
export const cariTindakanKlinik = (cari, batas = 20) => panggilApi('GET', `/tindakan-klinik?${new URLSearchParams({ cari, batas: String(batas) }).toString()}`);
export const daftarFavorit = (jenis) => panggilApi('GET', `/favorit${jenis ? `?jenis=${jenis}` : ''}`);
export const tambahFavorit = (m) => panggilApi('POST', '/favorit', m);
export const ubahUrutanFavorit = (id, urutan) => panggilApi('PATCH', `/favorit/${id}`, { urutan });
export const hapusFavorit = (id) => panggilApi('DELETE', `/favorit/${id}`);
export const daftarTemplat = (bagian) => panggilApi('GET', `/templat-catatan${bagian ? `?bagian=${bagian}` : ''}`);
export const tambahTemplat = (m) => panggilApi('POST', '/templat-catatan', m);
export const hapusTemplat = (id) => panggilApi('DELETE', `/templat-catatan/${id}`);
export const ambilFolderKeluarga = (pasienId) => panggilApi('GET', `/pasien/${pasienId}/keluarga`);
export const tautkanKeluarga = (pasienId, m) => panggilApi('POST', `/pasien/${pasienId}/keluarga`, m);
export const ubahKeluarga = (pasienId, id, m) => panggilApi('PATCH', `/pasien/${pasienId}/keluarga/${id}`, m);
// Draf alur klinis di server (bukan penyimpanan lokal): satu draf per alur, pengguna, dan kunjungan.
export const bacaDrafKlinis = (kunjunganId, alur) => panggilApi('GET', `/kunjungan/${kunjunganId}/draf/${alur}`);
export const simpanDrafKlinis = (kunjunganId, alur, langkah, isi) => panggilApi('PUT', `/kunjungan/${kunjunganId}/draf/${alur}`, { langkah, isi });
export const hapusDrafKlinis = (kunjunganId, alur) => panggilApi('DELETE', `/kunjungan/${kunjunganId}/draf/${alur}`);
export const jelajahKamus = (sistem, halaman, awalan = '') => panggilApi('GET', `/terminologi/kamus?${new URLSearchParams({ sistem, halaman: String(halaman), ukuran: '30', ...(awalan ? { awalan } : {}) })}`);
