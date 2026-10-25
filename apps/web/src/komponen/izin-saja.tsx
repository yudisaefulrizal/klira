import type { ReactNode } from 'react';
import type { AksiIzin, CakupanIzin } from '@klira/shared';
import { punyaIzin } from '@klira/shared';
import { usePengguna } from '../util/konteks-pengguna';

/** Hook: apakah akun yang masuk punya izin ini (5.1m: tombol tanpa izin tidak ditampilkan). */
export function useIzin() {
  const { pengguna } = usePengguna();
  return (fitur: string, aksi: AksiIzin, cakupan?: CakupanIzin) => !!pengguna && punyaIzin(pengguna, fitur, aksi, cakupan);
}

/** Penyembunyi: anak hanya dirender bila akun punya izinnya; tanpa izin tidak menampilkan apa pun. */
export function HanyaDenganIzin({ fitur, aksi, cakupan, children }: { fitur: string; aksi: AksiIzin; cakupan?: CakupanIzin; children: ReactNode }) {
  const boleh = useIzin();
  return boleh(fitur, aksi, cakupan) ? <>{children}</> : null;
}
