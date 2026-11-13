import { BATAS_KEAMANAN, pengaturanKeamananMasukan } from '@klira/shared';
import { galatSkema } from '../../modal/akun-pengaturan/keadaan-akun.js';
export const formDariPengaturan = (p) => ({
    masa_sesi_jam: String(p.masa_sesi_jam),
    batas_percobaan_masuk: String(p.batas_percobaan_masuk),
    panjang_minimum_kata_sandi: String(p.panjang_minimum_kata_sandi),
});
const angka = (t) => (t.trim() === '' ? Number.NaN : Number(t));
export const bentukKeamanan = (f) => ({
    masa_sesi_jam: angka(f.masa_sesi_jam),
    batas_percobaan_masuk: angka(f.batas_percobaan_masuk),
    panjang_minimum_kata_sandi: angka(f.panjang_minimum_kata_sandi),
});
export const galatKeamanan = (f) => galatSkema(pengaturanKeamananMasukan, bentukKeamanan(f));
export const keamananBerubah = (awal, f) => Object.keys(awal).some((k) => awal[k].trim() !== f[k].trim());
export const BATAS_FORM = BATAS_KEAMANAN;
