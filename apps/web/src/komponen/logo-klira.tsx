import type { CSSProperties } from 'react';
import './logo-klira.css';

/** Aset asli proyek klinik lama; versi monokrom memakai alpha mask untuk latar gelap. */
export function LogoKlira({ lebar = 160, monokrom = false }: { lebar?: number; monokrom?: boolean }) {
  return <span className={`logo-klira ${monokrom ? 'logo-klira-monokrom' : 'logo-klira-asli'}`} style={{ '--logo-klira-lebar': `${lebar}px` } as CSSProperties} role={monokrom ? 'img' : undefined} aria-label={monokrom ? 'Klira' : undefined}>
    {!monokrom && <img src="/asset/brand/klira.png" alt="Klira" width="2172" height="724" />}
  </span>;
}
