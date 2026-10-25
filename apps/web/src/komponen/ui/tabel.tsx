import type { ReactNode, TdHTMLAttributes } from 'react';
import { token } from '../../gaya/token';

export type KolomTabel = { judul: string; rataKanan?: boolean };

/** Tabel dasar: kepala dari `kolom`, isi berupa BarisTabel. */
export function Tabel({ kolom, children, label }: { kolom: readonly KolomTabel[]; children: ReactNode; label: string }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table aria-label={label} style={{ width: '100%', borderCollapse: 'collapse', fontSize: token.huruf.ukuran.dasar, minWidth: token.ukuran.tabelMin }}>
        <thead>
          <tr style={{ background: token.warna.kepalaTabel, textAlign: 'left', color: token.warna.teksMenu, fontSize: token.huruf.ukuran.kecil }}>
            {kolom.map((k) => (
              <th key={k.judul} scope="col" style={{ padding: `${token.jarak.sm} ${token.jarak.md}`, fontWeight: token.huruf.berat.tebal, textAlign: k.rataKanan ? 'right' : 'left' }}>
                {k.judul}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function BarisTabel({ children }: { children: ReactNode }) {
  return <tr style={{ borderTop: `${token.ukuran.garis} solid ${token.warna.garisHalus}` }}>{children}</tr>;
}

export function SelTabel({ style, ...sisa }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td style={{ padding: `${token.jarak.md}`, verticalAlign: 'top', ...style }} {...sisa} />;
}
