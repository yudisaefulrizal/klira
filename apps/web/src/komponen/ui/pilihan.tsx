import type { SelectHTMLAttributes } from 'react';
import { token } from '../../gaya/token';
import { PesanGalat, gayaKontrol } from './isian';

type Opsi = { nilai: string; label: string };
type Props = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> & { label: string; id: string; opsi: readonly Opsi[]; galat?: string };

export function Pilihan({ label, id, opsi, style, galat, ...sisa }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: token.jarak.xs }}>
      <label htmlFor={id} style={{ fontSize: token.huruf.ukuran.dasar, fontWeight: token.huruf.berat.sedang }}>
        {label}
      </label>
      <select id={id} style={{ ...gayaKontrol, ...(galat ? { borderColor: token.warna.status.merah.teks } : {}), ...style }} aria-invalid={galat ? true : undefined} aria-describedby={galat ? `${id}-galat` : undefined} {...sisa}>
        {opsi.map((o) => <option key={o.nilai} value={o.nilai}>{o.label}</option>)}
      </select>
      {galat && <PesanGalat id={`${id}-galat`}>{galat}</PesanGalat>}
    </div>
  );
}
