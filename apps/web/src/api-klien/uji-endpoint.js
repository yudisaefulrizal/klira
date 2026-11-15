import { panggilApi } from './klien.js';
export const ambilKatalogUji = (layanan) => panggilApi('GET', `/test-endpoint/${layanan}/katalog`);
export const kirimUji = (m) => panggilApi('POST', '/test-endpoint/kirim', m);
