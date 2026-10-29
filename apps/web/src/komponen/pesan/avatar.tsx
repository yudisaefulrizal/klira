import { useState } from 'react';

export function AvatarKontak({ id, nama, foto }: { id: number; nama: string; foto?: string | null }) {
  const [gagal, setGagal] = useState<string | null>(null);
  const inisial = nama.split(/\s+/).slice(0, 2).map((v) => v[0]).join('').toUpperCase();
  return (
    <span className="wa-avatar" data-warna={id % 4} aria-hidden="true" style={{ overflow: 'hidden' }}>
      {foto && gagal !== foto ? (
        <img src={foto} alt="" referrerPolicy="no-referrer" loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setGagal(foto)} />
      ) : inisial}
    </span>
  );
}
