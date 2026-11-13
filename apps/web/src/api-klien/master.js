import { panggilApi } from './klien.js';
export function queryMaster(f) {
    const q = new URLSearchParams({ halaman: String(f.halaman), ukuran: String(f.ukuran) });
    if (f.cari)
        q.set('cari', f.cari);
    if (f.status && f.status !== 'semua')
        q.set('status', f.status);
    if (f.tingkat)
        q.set('tingkat', f.tingkat);
    return q.toString();
}
export const daftarMaster = (jenis, f) => panggilApi('GET', `/master/${jenis}?${queryMaster(f)}`);
export const opsiMaster = (sumber) => panggilApi('GET', `/master/opsi/${sumber}`);
export const buatMaster = (jenis, m) => panggilApi('POST', `/master/${jenis}`, m);
export const ubahMaster = (jenis, id, m) => panggilApi('PATCH', `/master/${jenis}/${id}`, m);
export const ubahAktifMaster = (jenis, id, aktif) => panggilApi('PATCH', `/master/${jenis}/${id}/aktif`, { aktif });
export const ambilProfilKlinik = () => panggilApi('GET', '/fasyankes/profil');
export const simpanProfilKlinik = (m) => panggilApi('PATCH', '/fasyankes/profil', m);
export const daftarRiwayatProfil = (halaman, ukuran) => panggilApi('GET', `/fasyankes/riwayat-profil?halaman=${halaman}&ukuran=${ukuran}`);
