import { panggilApi } from './klien.js';
export function queryRekapLab(f) {
    const q = new URLSearchParams({ halaman: String(f.halaman), ukuran: String(f.ukuran) });
    if (f.status)
        q.set('status', f.status);
    if (f.dari)
        q.set('dari', f.dari);
    if (f.sampai)
        q.set('sampai', f.sampai);
    return q.toString();
}
export const rekapLab = (f) => panggilApi('GET', `/penunjang/rekap?${queryRekapLab(f)}`);
export function queryMaster(f) {
    const q = new URLSearchParams();
    if (f.cari?.trim())
        q.set('cari', f.cari.trim());
    if (f.aktif !== undefined)
        q.set('aktif', String(f.aktif));
    return q.toString();
}
export const daftarMasterPemeriksaan = (f = {}) => panggilApi('GET', `/penunjang/master?${queryMaster(f)}`);
export const cariLoinc = (cari, batas) => panggilApi('GET', `/penunjang/loinc?${new URLSearchParams({ cari: cari.trim(), ...(batas ? { batas: String(batas) } : {}) }).toString()}`);
export const tarifLab = () => panggilApi('GET', '/penunjang/tarif');
export const buatMasterPemeriksaan = (m) => panggilApi('POST', '/penunjang/master', m);
export const ubahMasterPemeriksaan = (id, m) => panggilApi('PATCH', `/penunjang/master/${id}`, m);
export const ordersKunjungan = (kunjunganId) => panggilApi('GET', `/kunjungan/${kunjunganId}/penunjang/order`);
export const buatOrderLab = (kunjunganId, m) => panggilApi('POST', `/kunjungan/${kunjunganId}/penunjang/order`, m);
export const ambilSpesimen = (orderId, m) => panggilApi('POST', `/penunjang/order/${orderId}/spesimen`, m);
export const isiHasilLab = (orderId, m) => panggilApi('PUT', `/penunjang/order/${orderId}/hasil`, m);
export const validasiHasilLab = (orderId) => panggilApi('POST', `/penunjang/order/${orderId}/validasi`);
