import { DAFTAR_PERINGATAN } from '@klira/shared';
import { GalatApi, panggilApi } from './klien.js';
export const daftarIzin = () => panggilApi('GET', '/izin');
export const daftarJenisAkun = () => panggilApi('GET', '/jenis-akun');
export const riwayatJenisAkun = (id) => panggilApi('GET', `/jenis-akun/${id}/riwayat`);
export const buatJenisAkun = (m) => panggilApi('POST', '/jenis-akun', m);
export const ubahJenisAkun = (id, m) => panggilApi('PATCH', `/jenis-akun/${id}`, m);
export const daftarPenugasan = (penggunaId) => panggilApi('GET', `/pengguna/${penggunaId}/penugasan`);
export const tugaskanJenis = (penggunaId, m) => panggilApi('POST', `/pengguna/${penggunaId}/penugasan`, m);
export const akhiriPenugasan = (penggunaId, id, selesai) => panggilApi('PATCH', `/pengguna/${penggunaId}/penugasan/${id}`, { selesai });
export const daftarIzinAkun = (penggunaId) => panggilApi('GET', `/pengguna/${penggunaId}/izin-akun`);
export const beriIzinAkun = (penggunaId, m) => panggilApi('POST', `/pengguna/${penggunaId}/izin-akun`, m);
export const akhiriIzinAkun = (penggunaId, id, selesai) => panggilApi('PATCH', `/pengguna/${penggunaId}/izin-akun/${id}`, { selesai });
export const aksesEfektif = (penggunaId) => panggilApi('GET', `/pengguna/${penggunaId}/akses-efektif`);
export const daftarPeringatan = async (f) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(f))
        if (v !== undefined && v !== '')
            q.set(k, String(v));
    const hasil = await panggilApi('GET', `/peringatan-izin?${q.toString()}`);
    if (!hasil || !Array.isArray(hasil.data) || !Number.isFinite(hasil.total)
        || !Number.isInteger(hasil.halaman) || hasil.halaman < 1
        || !Number.isInteger(hasil.ukuran) || hasil.ukuran < 1) {
        throw new GalatApi(200, DAFTAR_PERINGATAN.gagalMuat);
    }
    return hasil;
};
export const terimaPeringatan = (m) => panggilApi('POST', '/peringatan-izin/terima', m);
