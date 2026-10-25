import type { HTMLAttributes } from 'react';
import { token } from '../../gaya/token';

type Jarak = keyof typeof token.jarak;

/** Susunan vertikal dasar: isian bertumpuk dengan jarak token. */
export function Kolom({ jarak = 'md', style, ...sisa }: HTMLAttributes<HTMLDivElement> & { jarak?: Jarak }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: token.jarak[jarak], ...style }} {...sisa} />;
}

/** Dua kolom sejajar untuk isian pendek. */
export function Baris({ style, ...sisa }: HTMLAttributes<HTMLDivElement>) {
  return <div style={{ display: 'grid', gridTemplateColumns: `${token.ukuran.kolomKiri} ${token.ukuran.kolomKanan}`, gap: token.jarak.md, ...style }} {...sisa} />;
}

export type BagianRingkasan = { judul: string; baris: { label: string; nilai: string }[] };

/** Ringkasan baca-saja: bagian berjudul berisi pasangan label dan nilai (ringkasan modal dan data pasien). */
export function DaftarRingkasan({ bagian }: { bagian: readonly BagianRingkasan[] }) {
  return (
    <Kolom>
      {bagian.map((b) => (
        <section key={b.judul} style={{ display: 'flex', flexDirection: 'column', gap: token.jarak.xs }}>
          <h4 style={{ margin: 0, fontSize: token.huruf.ukuran.besar, fontWeight: token.huruf.berat.tebal }}>{b.judul}</h4>
          <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'max-content 1fr', columnGap: token.jarak.md, rowGap: token.jarak.xs }}>
            {b.baris.map((r) => (
              <div key={r.label} style={{ display: 'contents' }}>
                <dt style={{ color: token.warna.teksRedup }}>{r.label}</dt>
                <dd style={{ margin: 0, fontWeight: token.huruf.berat.sedang, overflowWrap: 'anywhere' }}>{r.nilai}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </Kolom>
  );
}
