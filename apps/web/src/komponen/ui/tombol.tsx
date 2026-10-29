import type { ButtonHTMLAttributes } from 'react';
import { token } from '../../gaya/token';

type Varian = 'utama' | 'sekunder' | 'teks' | 'langkah';
type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  penuh?: boolean;
  varian?: Varian;
  /** Hanya varian `langkah`: butir daftar yang sedang aktif. */
  terpilih?: boolean;
};

const gayaVarian = {
  utama: { background: token.warna.utama, color: token.warna.diAtasUtama, border: 'none' },
  sekunder: { background: token.warna.permukaan, color: token.warna.utama, border: `${token.ukuran.garis} solid ${token.warna.garis}` },
  teks: { background: 'transparent', color: token.warna.utama, border: 'none' },
  langkah: { background: 'transparent', color: token.warna.teks, border: 'none' },
} as const;

/** Butir daftar (mis. daftar langkah modal): rata kiri, tinggi mengikuti isi. */
const gayaLangkah = { display: 'flex', alignItems: 'center', gap: token.jarak.sm, textAlign: 'left', height: 'auto', padding: token.jarak.sm } as const;

export function Tombol({ penuh, varian = 'utama', terpilih, style, disabled, ...sisa }: Props) {
  const langkah = varian === 'langkah';
  return (
    <button
      disabled={disabled}
      style={{
        height: token.ukuran.tombol,
        padding: `0 ${token.jarak.md}`,
        width: penuh ? '100%' : undefined,
        ...gayaVarian[varian],
        ...(langkah ? gayaLangkah : {}),
        ...(langkah && terpilih ? { background: token.warna.utamaLatar, color: token.warna.utamaGelap, fontWeight: token.huruf.berat.tebal } : {}),
        borderRadius: token.radius.sedang,
        fontFamily: token.huruf.keluarga,
        fontSize: token.huruf.ukuran.dasar,
        fontWeight: langkah && terpilih ? token.huruf.berat.tebal : langkah ? token.huruf.berat.biasa : token.huruf.berat.sedang,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        ...style,
      }}
      {...sisa}
    />
  );
}
