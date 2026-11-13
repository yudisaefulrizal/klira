import { panggilApi } from './klien.js';
export function queryDaftarPengguna(f) {
    const q = new URLSearchParams({ halaman: String(f.halaman), ukuran: String(f.ukuran) });
    if (f.cari)
        q.set('cari', f.cari);
    if (f.status && f.status !== 'semua')
        q.set('status', f.status);
    if (f.jenis_akun_id)
        q.set('jenis_akun_id', String(f.jenis_akun_id));
    return q.toString();
}
export const daftarPengguna = (f) => panggilApi('GET', `/pengguna?${queryDaftarPengguna(f)}`);
export const ubahAktifPengguna = (id, aktif) => panggilApi('PATCH', `/pengguna/${id}`, { aktif });
/** Buat akun beserta profil, penugasan, dan izin per akun. Respons memuat kata sandi awal satu-satunya kali. */
export const buatPengguna = (m) => panggilApi('POST', '/pengguna', m);
