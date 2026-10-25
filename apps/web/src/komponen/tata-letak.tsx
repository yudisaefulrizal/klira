import type { ReactNode } from 'react';
import { token } from '../gaya/token';
import { useNavigasi } from '../util/navigasi';
import { MenuSamping } from './menu-samping';
import { Kolom, Sebaris } from './ui/susunan';

/** Kerangka halaman terautentikasi: menu samping di kiri, isi di kanan (dipakai semua halaman). */
export function TataLetak({ children }: { children: ReactNode }) {
  const { path, pindah } = useNavigasi();
  return (
    <Sebaris jarak="tanpa" bungkus sejajar="regang" style={{ minHeight: token.ukuran.tinggiLayar, background: token.warna.latar }}>
      <MenuSamping aktif={path} pindah={pindah} />
      <Kolom tag="main" jarak="md" style={{ flex: `999 1 ${token.ukuran.isiMin}`, minWidth: 0, boxSizing: 'border-box', padding: `${token.jarak.lg} ${token.jarak.xl}` }}>
        {children}
      </Kolom>
    </Sebaris>
  );
}
