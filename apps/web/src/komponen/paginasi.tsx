import { KEAMANAN } from '@klira/shared';
import { totalHalaman } from '../util/penyaring-tab';
import { Tombol } from './ui/tombol';
import { Sebaris } from './ui/susunan';

type Props = { halaman: number; total: number; ukuran: number; onPindah: (halaman: number) => void };

/** Paginasi sederhana: Sebelumnya, nomor halaman, Berikutnya; tidak tampil bila hanya satu halaman. */
export function Paginasi({ halaman, total, ukuran, onPindah }: Props) {
  if (total <= ukuran) return null;
  const jumlah = totalHalaman(total, ukuran);
  return (
    <Sebaris tag="nav" jarak="md" padding="md" sebaran="akhir" aria-label="Paginasi">
      <Tombol varian="sekunder" disabled={halaman <= 1} onClick={() => onPindah(halaman - 1)}>{KEAMANAN.sebelumnya}</Tombol>
      <span>{halaman} / {jumlah}</span>
      <Tombol varian="sekunder" disabled={halaman >= jumlah} onClick={() => onPindah(halaman + 1)}>{KEAMANAN.berikutnya}</Tombol>
    </Sebaris>
  );
}
