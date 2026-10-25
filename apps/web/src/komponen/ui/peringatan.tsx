import type { HTMLAttributes } from 'react';
import { token } from '../../gaya/token';

type Nada = 'merah' | 'kuning' | 'biru';

/** `baris`: isi disusun sejajar (pesan dan tombol aksi di sampingnya). */
export function Peringatan({ nada = 'merah', baris = false, style, ...sisa }: HTMLAttributes<HTMLDivElement> & { nada?: Nada; baris?: boolean }) {
  const w = token.warna.status[nada];
  return (
    <div
      role="alert"
      style={{
        background: w.latar,
        color: w.teks,
        padding: token.jarak.sm,
        borderRadius: token.radius.sedang,
        fontSize: token.huruf.ukuran.dasar,
        ...(baris ? { display: 'flex', alignItems: 'center', gap: token.jarak.md } : {}),
        ...style,
      }}
      {...sisa}
    />
  );
}
