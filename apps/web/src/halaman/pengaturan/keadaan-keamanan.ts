import { BATAS_KEAMANAN, pengaturanKeamananMasukan } from '@klira/shared';
import type { PengaturanKeamananDto, PengaturanKeamananMasukan } from '@klira/shared';
import { galatSkema } from '../../modal/akun-pengaturan/keadaan-akun';
import type { GalatBidang } from '../../modal/akun-pengaturan/keadaan-akun';

/** Isian teks agar kosong dan huruf bisa dikenali sebagai galat. */
export type FormKeamanan = { masa_sesi_jam: string; batas_percobaan_masuk: string; panjang_minimum_kata_sandi: string };

export const formDariPengaturan = (p: PengaturanKeamananMasukan | PengaturanKeamananDto): FormKeamanan => ({
  masa_sesi_jam: String(p.masa_sesi_jam),
  batas_percobaan_masuk: String(p.batas_percobaan_masuk),
  panjang_minimum_kata_sandi: String(p.panjang_minimum_kata_sandi),
});

const angka = (t: string): number => (t.trim() === '' ? Number.NaN : Number(t));

export const bentukKeamanan = (f: FormKeamanan): PengaturanKeamananMasukan => ({
  masa_sesi_jam: angka(f.masa_sesi_jam),
  batas_percobaan_masuk: angka(f.batas_percobaan_masuk),
  panjang_minimum_kata_sandi: angka(f.panjang_minimum_kata_sandi),
});

export const galatKeamanan = (f: FormKeamanan): GalatBidang => galatSkema(pengaturanKeamananMasukan, bentukKeamanan(f));

export const keamananBerubah = (awal: FormKeamanan, f: FormKeamanan): boolean =>
  (Object.keys(awal) as (keyof FormKeamanan)[]).some((k) => awal[k].trim() !== f[k].trim());

export const BATAS_FORM = BATAS_KEAMANAN;
