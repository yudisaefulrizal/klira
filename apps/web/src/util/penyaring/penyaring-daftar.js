import { STATUS_PENGGUNA } from '@klira/shared';
export const KEADAAN_AWAL = { cari: '', status: 'semua', halaman: 1 };
export function keadaanDariQuery(search) {
    const q = new URLSearchParams(search);
    const status = q.get('status');
    const halaman = Number(q.get('halaman'));
    return {
        cari: (q.get('cari') ?? '').trim(),
        status: status && STATUS_PENGGUNA.includes(status) ? status : KEADAAN_AWAL.status,
        halaman: Number.isInteger(halaman) && halaman >= 1 ? halaman : 1,
    };
}
/** Query string hanya memuat nilai yang berbeda dari bawaan; `lain` menyimpan parameter lain (mis. tab). */
export function queryDariKeadaan(k, lain = {}) {
    const q = new URLSearchParams(lain);
    if (k.cari.trim())
        q.set('cari', k.cari.trim());
    if (k.status !== KEADAAN_AWAL.status)
        q.set('status', k.status);
    if (k.halaman > 1)
        q.set('halaman', String(k.halaman));
    const teks = q.toString();
    return teks ? `?${teks}` : '';
}
/** Mengubah pencarian atau status mengembalikan ke halaman pertama; ganti halaman mempertahankan penyaring. */
export function ubahKeadaan(k, perubahan) {
    const berubahPenyaring = (perubahan.cari !== undefined && perubahan.cari !== k.cari) || (perubahan.status !== undefined && perubahan.status !== k.status);
    return { ...k, ...perubahan, halaman: perubahan.halaman ?? (berubahPenyaring ? 1 : k.halaman) };
}
