import { BERANDA } from '@klira/shared';
import type { RingkasanPdpDto } from '@klira/shared';

export type Tugas = { kunci: string; teks: string; tab: string; mendesak: boolean };

/** Tugas PDP dari ringkasan: hanya yang bernilai di atas nol; yang lewat batas ditandai mendesak dan didahulukan. */
export function tugasPdp(r: RingkasanPdpDto): Tugas[] {
  const T = BERANDA.pdp;
  const lewat: [string, number, string, string][] = [
    ['hak_terlambat', r.hak_terlambat, T.hakTerlambat(r.hak_terlambat), 'hak'],
    ['insiden_terlambat', r.insiden_terlambat, T.insidenTerlambat(r.insiden_terlambat), 'insiden'],
    ['pemusnahan_terlambat', r.pemusnahan_terlambat, T.musnah(r.pemusnahan_terlambat), 'retensi'],
    ['dpia_jatuh_tempo', r.dpia_jatuh_tempo, T.dpia(r.dpia_jatuh_tempo), 'dpia'],
  ];
  const daftar: Tugas[] = lewat.filter(([, n]) => n > 0).map(([kunci, , teks, tab]) => ({ kunci, teks, tab, mendesak: true }));
  const tak = r.hak_aktif - r.hak_terlambat;
  if (tak > 0) daftar.push({ kunci: 'hak_aktif', teks: T.hakAktif(tak), tab: 'hak', mendesak: false });
  const belum = r.insiden_belum_notifikasi - r.insiden_terlambat;
  if (belum > 0) daftar.push({ kunci: 'insiden_belum', teks: T.insidenBelum(belum), tab: 'insiden', mendesak: false });
  return daftar;
}
