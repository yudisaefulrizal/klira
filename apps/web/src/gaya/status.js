import { warna } from './token.js';
/** Memetakan nama token warna status (dari @klira/shared) ke nilai tampilan. */
export function gayaStatus(info) {
    const nama = typeof info === 'string' ? info : info.warna;
    return warna.status[nama];
}
