import { GalatApi, panggilApi } from './klien.js';
export const masuk = (username, kata_sandi) => panggilApi('POST', '/masuk', { username, kata_sandi });
export const gantiKredensial = (masukan) => panggilApi('POST', '/ganti-kredensial', masukan);
export const keluar = () => panggilApi('POST', '/keluar', {});
/** Pengguna saat ini, atau null bila belum masuk. */
export async function ambilSaya() {
    try {
        return await panggilApi('GET', '/saya');
    }
    catch (galat) {
        if (galat instanceof GalatApi && galat.status === 401)
            return null;
        throw galat;
    }
}
