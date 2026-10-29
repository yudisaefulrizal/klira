import { TombolIkonPasien } from './ikon-pasien';
import { KEAMANAN } from '@klira/shared';
import { totalHalaman } from '../util/penyaring-tab';
import { Tombol } from './ui/tombol';
import { Sebaris } from './ui/susunan';

type Props = { modeIkon?: boolean; halaman: number; total: number; ukuran: number; onPindah: (halaman: number) => void };

/** Paginasi sederhana: Sebelumnya, nomor halaman, Berikutnya; tidak tampil bila hanya satu halaman. */
export function Paginasi({ halaman, total, ukuran, onPindah, modeIkon = false }: Props) {
  if (total <= ukuran) return null;
  const jumlah = totalHalaman(total, ukuran);
  return (
    <Sebaris tag="nav" jarak="md" padding="md" sebaran="akhir" aria-label="Paginasi">
      {modeIkon ? <TombolIkonPasien ikon="sebelumnya" label={KEAMANAN.sebelumnya} varian="sekunder" disabled={halaman <= 1} onClick={() => onPindah(halaman - 1)} /> : <Tombol varian="sekunder" disabled={halaman <= 1} onClick={() => onPindah(halaman - 1)}>{KEAMANAN.sebelumnya}</Tombol>}
      <span>{halaman} / {jumlah}</span>
      {modeIkon ? <TombolIkonPasien ikon="berikutnya" label={KEAMANAN.berikutnya} varian="sekunder" disabled={halaman >= jumlah} onClick={() => onPindah(halaman + 1)} /> : <Tombol varian="sekunder" disabled={halaman >= jumlah} onClick={() => onPindah(halaman + 1)}>{KEAMANAN.berikutnya}</Tombol>}
    </Sebaris>
  );
}
