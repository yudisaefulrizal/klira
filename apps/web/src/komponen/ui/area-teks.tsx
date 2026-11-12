import type { TextareaHTMLAttributes } from 'react';
import { token } from '../../gaya/token';
import { gayaDiubah, gayaKontrol, LabelIsian } from './isian';

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; id: string; /** Nilai berbeda dari default keadaan baik. */ diubah?: boolean };

export function AreaTeks({ label, id, style, diubah, ...sisa }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: token.jarak.xs }}>
      <LabelIsian htmlFor={id} label={label} diubah={diubah} />
      <textarea id={id} style={{ ...gayaKontrol, height: token.ukuran.areaTeks, padding: token.jarak.sm, resize: 'vertical', ...(diubah ? gayaDiubah : {}), ...style }} {...sisa} />
    </div>
  );
}
