import { GALAT } from '@klira/shared';
/** Pembantu bersama untuk berkas rute: bungkus penangan async, pengguna sesi, dan galat 404 seragam. */
export const bungkus = (f) => (req, res, next) => void f(req, res).catch(next);
export const pengguna = (res) => res.locals.pengguna;
export const tidakAda = (res) => void res.status(404).json({ galat: { kode: 'tidak_ditemukan', pesan: GALAT.tidakDitemukan } });
