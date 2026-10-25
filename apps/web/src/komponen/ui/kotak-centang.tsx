import type { InputHTMLAttributes, ReactNode } from 'react';
import { token } from '../../gaya/token';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { id: string; label: ReactNode; keterangan?: string };

export function KotakCentang({ id, label, keterangan, style, ...sisa }: Props) {
  return (
    <div style={{ display: 'flex', gap: token.jarak.sm, alignItems: 'flex-start', ...style }}>
      <input id={id} type="checkbox" style={{ marginTop: token.jarak.xs, accentColor: token.warna.utama }} {...sisa} />
      <label htmlFor={id} style={{ display: 'flex', flexDirection: 'column', gap: token.jarak.xs, cursor: 'pointer' }}>
        <span style={{ fontWeight: token.huruf.berat.sedang }}>{label}</span>
        {keterangan && <span style={{ fontSize: token.huruf.ukuran.kecil, color: token.warna.teksRedup }}>{keterangan}</span>}
      </label>
    </div>
  );
}
