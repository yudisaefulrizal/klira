import type { ButtonHTMLAttributes } from 'react';
import { token } from '../../gaya/token';

type Varian = 'utama' | 'sekunder' | 'teks';
type Props = ButtonHTMLAttributes<HTMLButtonElement> & { penuh?: boolean; varian?: Varian };

const gayaVarian = {
  utama: { background: token.warna.utama, color: token.warna.permukaan, border: 'none' },
  sekunder: { background: token.warna.permukaan, color: token.warna.utama, border: `${token.ukuran.garis} solid ${token.warna.garis}` },
  teks: { background: 'transparent', color: token.warna.utama, border: 'none' },
} as const;

export function Tombol({ penuh, varian = 'utama', style, disabled, ...sisa }: Props) {
  return (
    <button
      disabled={disabled}
      style={{
        height: token.ukuran.tombol,
        padding: `0 ${token.jarak.md}`,
        width: penuh ? '100%' : undefined,
        ...gayaVarian[varian],
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
