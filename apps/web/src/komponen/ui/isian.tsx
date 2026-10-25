import type { InputHTMLAttributes } from 'react';
import { token } from '../../gaya/token';

/** Gaya dasar kontrol formulir; dipakai bersama oleh Isian dan Pilihan. */
export const gayaKontrol = {
  height: token.ukuran.isian,
  padding: `0 ${token.jarak.sm}`,
  border: `${token.ukuran.garis} solid ${token.warna.garis}`,
  borderRadius: token.radius.sedang,
  background: token.warna.permukaan,
  color: token.warna.teks,
  fontFamily: token.huruf.keluarga,
  fontSize: token.huruf.ukuran.dasar,
} as const;

type Props = InputHTMLAttributes<HTMLInputElement> & { label: string; id: string };

export function Isian({ label, id, style, ...sisa }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: token.jarak.xs }}>
      <label htmlFor={id} style={{ fontSize: token.huruf.ukuran.dasar, fontWeight: token.huruf.berat.sedang }}>
        {label}
      </label>
      <input
        id={id}
        style={{ ...gayaKontrol, ...style }}
        {...sisa}
      />
    </div>
  );
}
