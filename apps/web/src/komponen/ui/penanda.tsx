import type { HTMLAttributes } from 'react';
import { token } from '../../gaya/token';

type Props = HTMLAttributes<HTMLSpanElement> & {
  /** Ukuran kotak penanda (token ukuran). */
  ukuran: 'logo' | 'penandaLangkah';
  /** `bulat` untuk penanda langkah, `sudut` untuk logo. */
  bentuk?: 'bulat' | 'sudut';
  /** `penuh`: latar warna utama; `garisUtama`: hanya garis utama; `garis`: hanya garis netral. */
  isi?: 'penuh' | 'garisUtama' | 'garis';
};

/** Kotak kecil berisi satu karakter atau angka (logo menu, penanda nomor langkah). */
export function Penanda({ ukuran, bentuk = 'bulat', isi = 'penuh', style, ...sisa }: Props) {
  const garis = (warna: string) => `${token.ukuran.garis} solid ${warna}`;
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        width: token.ukuran[ukuran], height: token.ukuran[ukuran],
        borderRadius: bentuk === 'bulat' ? token.radius.pil : token.radius.sedang,
        fontSize: ukuran === 'logo' ? undefined : token.huruf.ukuran.kecil,
        fontWeight: ukuran === 'logo' ? token.huruf.berat.tebal : undefined,
        background: isi === 'penuh' ? token.warna.utama : 'transparent',
        color: isi === 'penuh' ? token.warna.permukaan : 'inherit',
        border: isi === 'penuh' ? 'none' : garis(isi === 'garisUtama' ? token.warna.utama : token.warna.garisIsian),
        ...style,
      }}
      {...sisa}
    />
  );
}

/** Teks kode satu baris yang mudah dipilih (mis. kata sandi awal), berbasis token. */
export function Kode({ style, ...sisa }: HTMLAttributes<HTMLElement>) {
  return (
    <code
      style={{
        fontSize: token.huruf.ukuran.judul, fontWeight: token.huruf.berat.tebal, letterSpacing: token.huruf.jarakHuruf.kode,
        background: token.warna.kepalaTabel, padding: `${token.jarak.sm} ${token.jarak.md}`, borderRadius: token.radius.sedang,
        border: `${token.ukuran.garis} solid ${token.warna.garis}`, userSelect: 'all', ...style,
      }}
      {...sisa}
    />
  );
}
