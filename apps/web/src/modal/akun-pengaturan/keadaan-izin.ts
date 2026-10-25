import { ATUR_IZIN, IZIN, STATUS_PERIODE, izinAkunPembuatan, penugasanAkunBaru } from '@klira/shared';
import type { AksesEfektif, KonfirmasiPeringatan } from '@klira/shared';
import type { IzinAkunDto, PenugasanDto } from '../../api-klien/izin';
import { galatSkema } from './keadaan-akun';
import type { BarisIzinForm, GalatBidang, JenisKatalog } from './keadaan-akun';

export type StatusPeriode = keyof typeof STATUS_PERIODE.peta;

/** Potong tanggal-waktu ISO dari API menjadi YYYY-MM-DD. */
export const tanggalSaja = (t: string | null | undefined): string => (t ? t.slice(0, 10) : '');

/** Status periode menurut hari ini (YYYY-MM-DD, perbandingan teks sah karena format tetap). Selesai bersifat inklusif. */
export function statusPeriode(mulai: string, selesai: string | null | undefined, hariIni: string): StatusPeriode {
  const m = tanggalSaja(mulai);
  const s = tanggalSaja(selesai);
  if (m > hariIni) return 'akan_datang';
  if (s && s < hariIni) return 'berakhir';
  return 'berjalan';
}

export const periodeTeks = (mulai: string, selesai: string | null | undefined): string =>
  `${tanggalSaja(mulai)} s.d. ${tanggalSaja(selesai) || ATUR_IZIN.tanpaBatas}`;

export type PenugasanForm = { jenis_akun_id: string; mulai: string; selesai: string };
export const penugasanAwal = (hariIni: string): PenugasanForm => ({ jenis_akun_id: '', mulai: hariIni, selesai: '' });
export const izinAwal = (hariIni: string): BarisIzinForm => ({ izin_id: 0, tipe: 'tambah', alasan: '', mulai: hariIni, selesai: '' });

const kosongJadi = (v: string) => (v.trim() === '' ? undefined : v.trim());
const bentukPenugasan = (f: PenugasanForm) => ({ jenis_akun_id: Number(f.jenis_akun_id) || 0, mulai: f.mulai, selesai: kosongJadi(f.selesai) });

export function galatPenugasanBaru(f: PenugasanForm): GalatBidang {
  const g = galatSkema(penugasanAkunBaru, bentukPenugasan(f));
  const hasil: GalatBidang = {};
  if (g.jenis_akun_id) hasil.jenis_akun_id = g.jenis_akun_id;
  if (g.mulai) hasil.mulai = g.mulai;
  if (g.selesai) hasil.selesai = g.selesai;
  return hasil;
}

/** Badan POST /pengguna/:id/penugasan. */
export function bentukPenugasanBaru(f: PenugasanForm, konfirmasi?: KonfirmasiPeringatan) {
  return { ...bentukPenugasan(f), ...(konfirmasi ? { konfirmasi_peringatan: konfirmasi } : {}) };
}

const bentukIzin = (f: BarisIzinForm) => ({ ...f, selesai: kosongJadi(f.selesai) });
export const galatIzinBaru = (f: BarisIzinForm): GalatBidang => galatSkema(izinAkunPembuatan, bentukIzin(f));

/** Badan POST /pengguna/:id/izin-akun; alasan dipangkas dan wajib. */
export function bentukIzinBaru(f: BarisIzinForm, konfirmasi?: KonfirmasiPeringatan) {
  return { ...bentukIzin(f), alasan: f.alasan.trim(), ...(konfirmasi ? { konfirmasi_peringatan: konfirmasi } : {}) };
}

/** Galat ubah periode: tanggal selesai wajib dan tidak sebelum mulai. */
export function galatUbahPeriode(mulai: string, selesai: string): string | null {
  if (!selesai.trim()) return ATUR_IZIN.selesaiWajib;
  return selesai.trim() < tanggalSaja(mulai) ? IZIN.selesaiSebelumMulai : null;
}

/** Jenis akun aktif yang belum berjalan atau terjadwal pada akun ini (menghindari penugasan ganda). */
export function opsiJenisBaru(jenis: readonly JenisKatalog[], penugasan: readonly PenugasanDto[], hariIni: string): JenisKatalog[] {
  const dipakai = new Set(penugasan.filter((p) => statusPeriode(p.mulai, p.selesai, hariIni) !== 'berakhir').map((p) => p.jenis_akun_id));
  return jenis.filter((j) => j.aktif && !dipakai.has(j.id));
}

/** Jenis akun yang paketnya dihitung untuk pilihan izin: penugasan yang belum berakhir. */
export const jenisBerjalan = (jenis: readonly JenisKatalog[], penugasan: readonly PenugasanDto[], hariIni: string): JenisKatalog[] =>
  jenis.filter((j) => penugasan.some((p) => p.jenis_akun_id === j.id && statusPeriode(p.mulai, p.selesai, hariIni) !== 'berakhir'));

/** Baris izin akun yang masih berlaku atau terjadwal pada tipe sama, agar tidak ditambahkan ganda. */
export const izinTerpakai = (izinAkun: readonly IzinAkunDto[], hariIni: string): BarisIzinForm[] =>
  izinAkun
    .filter((i) => statusPeriode(i.mulai, i.selesai, hariIni) !== 'berakhir')
    .map((i) => ({ izin_id: i.izin_id, tipe: i.tipe, alasan: i.alasan, mulai: tanggalSaja(i.mulai), selesai: tanggalSaja(i.selesai) }));

export type BagianAkses = { judul?: string; baris: { label: string; nilai: string }[] };

/** Akses efektif untuk Panel detail: jenis akun, fitur, dan daftar izin. */
export function bagianAkses(a: AksesEfektif): BagianAkses[] {
  const tidakAda = ATUR_IZIN.aksesTidakAda;
  const perFitur = new Map<string, string[]>();
  for (const i of a.izin) perFitur.set(i.fitur, [...(perFitur.get(i.fitur) ?? []), `${i.aksi} (${i.cakupan})`]);
  return [
    {
      baris: [
        { label: ATUR_IZIN.aksesJenis, nilai: a.jenis_akun.length ? a.jenis_akun.join(', ') : tidakAda },
        { label: ATUR_IZIN.aksesFitur, nilai: a.fitur.length ? a.fitur.join(', ') : tidakAda },
        { label: ATUR_IZIN.aksesIzin, nilai: String(a.izin.length) },
      ],
    },
    { judul: ATUR_IZIN.aksesIzin, baris: [...perFitur.entries()].map(([fitur, daftar]) => ({ label: fitur, nilai: daftar.join(', ') })) },
  ];
}
