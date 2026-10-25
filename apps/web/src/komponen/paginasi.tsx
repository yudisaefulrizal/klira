import { KEAMANAN } from '@klira/shared';
import { token } from '../gaya/token';
import { totalHalaman } from '../util/penyaring-tab';
import { Tombol } from './ui/tombol';

type Props = { halaman: number; total: number; ukuran: number; onPindah: (halaman: number) => void };

/** Paginasi sederhana: Sebelumnya, nomor halaman, Berikutnya; tidak tampil bila hanya satu halaman. */
export function Paginasi({ halaman, total, ukuran, onPindah }: Props) {
  if (total <= ukuran) return null;
  const jumlah = totalHalaman(total, ukuran);
  return (
    <nav aria-label="Paginasi" style={{ padding: token.jarak.md, display: 'flex', alignItems: 'center', gap: token.jarak.md, justifyContent: 'flex-end' }}>
      <Tombol varian="sekunder" disabled={halaman <= 1} onClick={() => onPindah(halaman - 1)}>{KEAMANAN.sebelumnya}</Tombol>
      <span>{halaman} / {jumlah}</span>
      <Tombol varian="sekunder" disabled={halaman >= jumlah} onClick={() => onPindah(halaman + 1)}>{KEAMANAN.berikutnya}</Tombol>
    </nav>
  );
}
