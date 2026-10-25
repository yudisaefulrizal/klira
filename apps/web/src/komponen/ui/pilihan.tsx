import type { SelectHTMLAttributes } from 'react';
import { token } from '../../gaya/token';
import { gayaKontrol } from './isian';

type Opsi = { nilai: string; label: string };
type Props = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> & { label: string; id: string; opsi: readonly Opsi[] };

export function Pilihan({ label, id, opsi, style, ...sisa }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: token.jarak.xs }}>
      <label htmlFor={id} style={{ fontSize: token.huruf.ukuran.dasar, fontWeight: token.huruf.berat.sedang }}>
        {label}
      </label>
      <select id={id} style={{ ...gayaKontrol, ...style }} {...sisa}>
        {opsi.map((o) => <option key={o.nilai} value={o.nilai}>{o.label}</option>)}
      </select>
    </div>
  );
}
