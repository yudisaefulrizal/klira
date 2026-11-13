import { panggilApi } from './klien.js';
export const ambilRingkasanPdp = () => panggilApi('GET', '/pdp/ringkasan');
export const ambilKesiapan = () => panggilApi('GET', '/master/kesiapan');
