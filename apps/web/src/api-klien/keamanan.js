import { GALAT } from '@klira/shared';
import { GalatApi, panggilApi } from './klien.js';
export const ambilPengaturanKeamanan = () => panggilApi('GET', '/pengaturan-keamanan');
export const simpanPengaturanKeamanan = (m) => panggilApi('PATCH', '/pengaturan-keamanan', m);
export const daftarRiwayatBackup = (halaman, ukuran) => panggilApi('GET', `/riwayat-backup?halaman=${halaman}&ukuran=${ukuran}`);
export const resetSistem = () => panggilApi('POST', '/cadangan/reset', { konfirmasi: 'RESET' });
export const alamatUnduhBackup = '/api/cadangan/unduh';
export async function unggahBackup(berkas) {
    let res;
    try {
        res = await fetch('/api/cadangan/pulihkan', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/octet-stream' }, body: berkas });
    }
    catch {
        throw new GalatApi(0, GALAT.jaringan);
    }
    if (!res.ok) {
        const isi = (await res.json().catch(() => null));
        throw new GalatApi(res.status, isi?.galat?.pesan ?? GALAT.umum);
    }
}
