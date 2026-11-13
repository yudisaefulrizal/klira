import { panggilApi } from './klien.js';
export function queryKlaim(f) {
    const q = new URLSearchParams({ halaman: String(f.halaman ?? 1), ukuran: String(f.ukuran ?? 20) });
    if (f.status)
        q.set('status', f.status);
    if (f.cari?.trim())
        q.set('cari', f.cari.trim());
    return q.toString();
}
export const daftarKlaim = (f) => panggilApi('GET', `/klaim?${queryKlaim(f)}`);
export const kandidatKlaim = () => panggilApi('GET', '/klaim/kandidat');
export const kodeKlaimKunjungan = (kunjunganId) => panggilApi('GET', `/klaim/kode/${kunjunganId}`);
export const ambilKlaim = (id) => panggilApi('GET', `/klaim/${id}`);
export const siapkanKlaim = (m) => panggilApi('POST', '/klaim', m);
export const ubahBerkasKlaim = (id, m) => panggilApi('PUT', `/klaim/${id}/berkas`, m);
export const ubahStatusKlaim = (id, m) => panggilApi('POST', `/klaim/${id}/status`, m);
