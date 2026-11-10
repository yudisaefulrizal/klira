import type { InputHTMLAttributes } from 'react';
import { token } from '../../gaya/token';
import { InfoBantuan } from './info-bantuan';

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

type Props = InputHTMLAttributes<HTMLInputElement> & { label: string; id: string; galat?: string; /** Penjelasan istilah teknis; tampil sebagai ikon info di samping label. */ petunjuk?: string };

/** Pesan galat bidang (di bawah kontrol); dipakai bersama Isian dan Pilihan. */
export function PesanGalat({ id, children }: { id: string; children: string }) {
  return (
    <span id={id} role="alert" style={{ color: token.warna.status.merah.teks, fontSize: token.huruf.ukuran.kecil }}>
      {children}
    </span>
  );
}

export function Isian({ label, id, style, galat, petunjuk, ...sisa }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: token.jarak.xs }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: token.jarak.xs }}>
        <label htmlFor={id} style={{ fontSize: token.huruf.ukuran.dasar, fontWeight: token.huruf.berat.sedang }}>
          {label}
        </label>
        {petunjuk && <InfoBantuan label={label}>{petunjuk}</InfoBantuan>}
      </div>
      <input
        id={id}
        style={{ ...gayaKontrol, ...(galat ? { borderColor: token.warna.status.merah.teks } : {}), ...style }}
        aria-invalid={galat ? true : undefined}
        aria-describedby={galat ? `${id}-galat` : undefined}
        {...sisa}
      />
      {galat && <PesanGalat id={`${id}-galat`}>{galat}</PesanGalat>}
    </div>
  );
}
