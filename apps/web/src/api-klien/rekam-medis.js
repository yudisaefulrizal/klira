import { panggilApi } from './klien.js';
export function queryBerkas(f) {
    const q = new URLSearchParams({ halaman: String(f.halaman ?? 1), ukuran: String(f.ukuran ?? 20) });
    if (f.cari?.trim())
        q.set('cari', f.cari.trim());
    if (f.dari)
        q.set('dari', f.dari);
    if (f.sampai)
        q.set('sampai', f.sampai);
    return q.toString();
}
export const daftarBerkas = (f) => panggilApi('GET', `/rekam-medis/berkas?${queryBerkas(f)}`);
export const ajukanPerbaikan = (kunjunganId, m) => panggilApi('POST', `/kunjungan/${kunjunganId}/perbaikan`, m);
export function queryPerbaikan(f) {
    const q = new URLSearchParams({ halaman: String(f.halaman ?? 1), ukuran: String(f.ukuran ?? 20) });
    if (f.status)
        q.set('status', f.status);
    return q.toString();
}
export const daftarPerbaikan = (f) => panggilApi('GET', `/rekam-medis/perbaikan?${queryPerbaikan(f)}`);
export const putuskanPerbaikan = (id, m) => panggilApi('POST', `/rekam-medis/perbaikan/${id}/keputusan`, m);
