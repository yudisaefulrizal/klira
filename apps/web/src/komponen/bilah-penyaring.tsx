import type { FormEvent, ReactNode } from 'react';
import { Tombol } from './ui/tombol';
import { Sebaris } from './ui/susunan';

type Props = { children: ReactNode; labelTerapkan: string; labelAturUlang: string; onTerapkan: () => void; onAturUlang: () => void; tombolLain?: ReactNode; nonaktif?: boolean };

/** Baris penyaring tab: kolom isian di dalam formulir dengan Terapkan dan Atur ulang (Enter menerapkan). */
export function BilahPenyaring({ children, labelTerapkan, labelAturUlang, onTerapkan, onAturUlang, tombolLain, nonaktif }: Props) {
  const kirim = (e: FormEvent) => {
    e.preventDefault();
    if (!nonaktif) onTerapkan();
  };
  return (
    <Sebaris tag="form" jarak="md" padding="md" bungkus sejajar="akhir" onSubmit={kirim}>
      {children}
      <Tombol type="submit" disabled={nonaktif}>{labelTerapkan}</Tombol>
      <Tombol type="button" varian="sekunder" onClick={onAturUlang}>{labelAturUlang}</Tombol>
      {tombolLain}
    </Sebaris>
  );
}
