import type { HTMLAttributes } from 'react';
import type { WarnaStatus } from '@klira/shared';
import { gayaStatus } from '../../gaya/status';
import { token } from '../../gaya/token';

/** Lencana kecil berwarna; warna dari nama token status (shared/status.ts). */
export function Lencana({ warna, style, ...sisa }: HTMLAttributes<HTMLSpanElement> & { warna: WarnaStatus }) {
  const w = gayaStatus(warna);
  return (
    <span
      style={{
        display: 'inline-block', padding: `${token.jarak.xs} ${token.jarak.sm}`, borderRadius: token.radius.pil,
        background: w.latar, color: w.teks, fontSize: token.huruf.ukuran.kecil, fontWeight: token.huruf.berat.tebal, ...style,
      }}
      {...sisa}
    />
  );
}
