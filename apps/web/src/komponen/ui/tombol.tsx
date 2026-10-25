import type { ButtonHTMLAttributes } from 'react';
import { token } from '../../gaya/token';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { penuh?: boolean };

export function Tombol({ penuh, style, disabled, ...sisa }: Props) {
  return (
    <button
      disabled={disabled}
      style={{
        height: token.ukuran.tombol,
        padding: `0 ${token.jarak.md}`,
        width: penuh ? '100%' : undefined,
        background: token.warna.utama,
        color: token.warna.permukaan,
        border: 'none',
        borderRadius: token.radius.sedang,
        fontFamily: token.huruf.keluarga,
        fontSize: token.huruf.ukuran.dasar,
        fontWeight: token.huruf.berat.sedang,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        ...style,
      }}
      {...sisa}
    />
  );
}
