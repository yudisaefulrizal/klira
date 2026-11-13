import { panggilApi } from './klien.js';
export function queryDaftarPasien(f) {
    const q = new URLSearchParams({ halaman: String(f.halaman), ukuran: String(f.ukuran) });
    if (f.untuk_kunjungan)
        q.set('untuk_kunjungan', 'true');
    if (f.tanggal)
        q.set('tanggal', f.tanggal);
    if (f.cari?.trim())
        q.set('cari', f.cari.trim());
    if (f.tahap && f.tahap !== 'semua')
        q.set('tahap', f.tahap);
    return q.toString();
}
export const daftarPasien = (f) => panggilApi('GET', `/pasien?${queryDaftarPasien(f)}`);
/** Membuka isi data pasien; tercatat di audit (lihat). */
export const detailPasien = (id) => panggilApi('GET', `/pasien/${id}`);
export const cekDuplikatPasien = (m) => panggilApi('POST', '/pasien/cek-duplikat', m);
export const teksGeneralConsent = () => panggilApi('GET', '/pasien/teks-persetujuan');
export const registrasiPasien = (m) => panggilApi('POST', '/pasien', m);
export const perbaikiPasien = (id, data) => panggilApi('PATCH', `/pasien/${id}`, data);
