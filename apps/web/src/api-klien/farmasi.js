import { panggilApi } from './klien.js';
export function queryMasterObat(f) {
    const q = new URLSearchParams();
    if (f.cari?.trim())
        q.set('cari', f.cari.trim());
    if (f.aktif !== undefined)
        q.set('aktif', String(f.aktif));
    if (f.halaman)
        q.set('halaman', String(f.halaman));
    if (f.ukuran)
        q.set('ukuran', String(f.ukuran));
    return q.toString();
}
export const cariKfa = (cari, batas) => panggilApi('GET', `/farmasi/kfa?${new URLSearchParams({ cari: cari.trim(), ...(batas ? { batas: String(batas) } : {}) }).toString()}`);
export const daftarMasterObat = (f = {}) => panggilApi('GET', `/farmasi/master?${queryMasterObat(f)}`);
export const buatMasterObat = (m) => panggilApi('POST', '/farmasi/master', m);
export const ubahMasterObat = (id, m) => panggilApi('PATCH', `/farmasi/master/${id}`, m);
export const stokObat = (id) => panggilApi('GET', `/farmasi/master/${id}/stok`);
export const catatMutasiStok = (m) => panggilApi('POST', '/farmasi/mutasi', m);
export function queryRiwayatObat(f) {
    const q = new URLSearchParams({ halaman: String(f.halaman ?? 1), ukuran: String(f.ukuran ?? 20) });
    if (f.status)
        q.set('status', f.status);
    if (f.dari)
        q.set('dari', f.dari);
    if (f.sampai)
        q.set('sampai', f.sampai);
    return q.toString();
}
export const riwayatObat = (f) => panggilApi('GET', `/farmasi/riwayat?${queryRiwayatObat(f)}`);
export const resepKunjungan = (kunjunganId) => panggilApi('GET', `/kunjungan/${kunjunganId}/resep`);
export const buatResep = (kunjunganId, m) => panggilApi('POST', `/kunjungan/${kunjunganId}/resep`, m);
export const telaahResep = (resepId, m) => panggilApi('POST', `/resep/${resepId}/telaah`, m);
export const siapkanResep = (resepId) => panggilApi('POST', `/resep/${resepId}/siap`);
export const serahkanObat = (kunjunganId, m = {}) => panggilApi('POST', `/kunjungan/${kunjunganId}/serah-terima-obat`, m);
/** Seluruh master obat aktif (dimuat per halaman 100) untuk pencarian obat di editor item resep. */
export async function semuaMasterObatAktif() {
    const awal = await daftarMasterObat({ aktif: true, ukuran: 100 });
    const semua = [...awal.data];
    for (let halaman = 2; semua.length < awal.total; halaman++) {
        const h = await daftarMasterObat({ aktif: true, ukuran: 100, halaman });
        if (!h.data.length)
            break;
        semua.push(...h.data);
    }
    return semua;
}
