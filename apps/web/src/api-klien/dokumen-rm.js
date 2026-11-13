import { panggilApi } from './klien.js';
const kueri = (o) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(o))
        if (v !== undefined && v !== '')
            q.set(k, String(v));
    return q.toString();
};
export const ambilDokumen = (kunjunganId) => panggilApi('GET', `/kunjungan/${kunjunganId}/dokumen`);
export const simpanResume = (kunjunganId, m) => panggilApi('PUT', `/kunjungan/${kunjunganId}/resume`, m);
export const buatSurat = (kunjunganId, m) => panggilApi('POST', `/kunjungan/${kunjunganId}/surat`, m);
export const daftarPembukaan = (f) => panggilApi('GET', `/rekam-medis/pembukaan?${kueri({ halaman: f.halaman ?? 1, ukuran: f.ukuran ?? 20, status: f.status })}`);
export const ajukanPembukaan = (m) => panggilApi('POST', '/rekam-medis/pembukaan', m);
export const putuskanPembukaan = (id, m) => panggilApi('POST', `/rekam-medis/pembukaan/${id}/keputusan`, m);
export const daftarPenyampaian = (f) => panggilApi('GET', `/rekam-medis/penyampaian?${kueri({ halaman: f.halaman ?? 1, ukuran: f.ukuran ?? 20, cari: f.cari?.trim() })}`);
export const catatPenyampaian = (m) => panggilApi('POST', '/rekam-medis/penyampaian', m);
export const buatLaporan = (f) => panggilApi('GET', `/rekam-medis/laporan?${kueri(f)}`);
