import type { HTMLAttributes } from 'react';
import { token } from '../../gaya/token';

export function Kartu({ style, ...sisa }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      style={{
        background: token.warna.permukaan,
        border: `1px solid ${token.warna.garis}`,
        borderRadius: token.radius.besar,
        boxShadow: token.bayangan.kartu,
        padding: token.jarak.lg,
        ...style,
      }}
      {...sisa}
    />
  );
}
