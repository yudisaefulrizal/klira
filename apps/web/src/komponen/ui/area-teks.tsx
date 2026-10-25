import type { TextareaHTMLAttributes } from 'react';
import { token } from '../../gaya/token';
import { gayaKontrol } from './isian';

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; id: string };

export function AreaTeks({ label, id, style, ...sisa }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: token.jarak.xs }}>
      <label htmlFor={id} style={{ fontSize: token.huruf.ukuran.dasar, fontWeight: token.huruf.berat.sedang }}>
        {label}
      </label>
      <textarea id={id} style={{ ...gayaKontrol, height: token.ukuran.areaTeks, padding: token.jarak.sm, resize: 'vertical', ...style }} {...sisa} />
    </div>
  );
}
