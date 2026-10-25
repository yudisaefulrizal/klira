import type { HTMLAttributes } from 'react';
import { token } from '../../gaya/token';

type Nada = 'merah' | 'kuning' | 'biru';

export function Peringatan({ nada = 'merah', style, ...sisa }: HTMLAttributes<HTMLDivElement> & { nada?: Nada }) {
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
        ...style,
      }}
      {...sisa}
    />
  );
}
