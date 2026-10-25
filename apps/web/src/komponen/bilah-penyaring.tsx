import type { FormEvent, ReactNode } from 'react';
import { token } from '../gaya/token';
import { Tombol } from './ui/tombol';

type Props = { children: ReactNode; labelTerapkan: string; labelAturUlang: string; onTerapkan: () => void; onAturUlang: () => void; tombolLain?: ReactNode; nonaktif?: boolean };

/** Baris penyaring tab: kolom isian di dalam formulir dengan Terapkan dan Atur ulang (Enter menerapkan). */
export function BilahPenyaring({ children, labelTerapkan, labelAturUlang, onTerapkan, onAturUlang, tombolLain, nonaktif }: Props) {
  const kirim = (e: FormEvent) => {
    e.preventDefault();
    if (!nonaktif) onTerapkan();
  };
  return (
    <form onSubmit={kirim} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: token.jarak.md, padding: token.jarak.md }}>
      {children}
      <Tombol type="submit" disabled={nonaktif}>{labelTerapkan}</Tombol>
      <Tombol type="button" varian="sekunder" onClick={onAturUlang}>{labelAturUlang}</Tombol>
      {tombolLain}
    </form>
  );
}
