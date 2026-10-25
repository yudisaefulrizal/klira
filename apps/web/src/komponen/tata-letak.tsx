import type { ReactNode } from 'react';
import { token } from '../gaya/token';
import { useNavigasi } from '../util/navigasi';
import { MenuSamping } from './menu-samping';

/** Kerangka halaman terautentikasi: menu samping di kiri, isi di kanan (dipakai semua halaman). */
export function TataLetak({ children }: { children: ReactNode }) {
  const { path, pindah } = useNavigasi();
  return (
    <div style={{ minHeight: token.ukuran.tinggiLayar, display: 'flex', flexWrap: 'wrap', background: token.warna.latar }}>
      <MenuSamping aktif={path} pindah={pindah} />
      <main
        style={{
          flex: `999 1 ${token.ukuran.isiMin}`, minWidth: 0, boxSizing: 'border-box', padding: `${token.jarak.lg} ${token.jarak.xl}`,
          display: 'flex', flexDirection: 'column', gap: token.jarak.md,
        }}
      >
        {children}
      </main>
    </div>
  );
}
