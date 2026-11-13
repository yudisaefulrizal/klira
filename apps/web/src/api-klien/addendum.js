import { panggilApi } from './klien.js';
export const daftarAddendum = (kunjunganId) => panggilApi('GET', `/kunjungan/${kunjunganId}/addendum`);
