import type { ReactNode } from 'react';
import { token } from '../../gaya/token';
import { Panel } from '../panel/panel';

export type BagianDetail = { judul?: string; baris: { label: string; nilai: ReactNode }[] };

type Props = { judul: string; onTutup: () => void; bagian: BagianDetail[]; children?: ReactNode };

/**
 * Panel detail (3.2): tampilan baca-saja untuk riwayat versi, detail log audit dan galat, rincian tagihan,
 * rincian kirim, dan akses efektif. Memakai Panel; pemanggil hanya mengisi bagian label-nilai (atau slot bebas).
 */
export function PanelDetail({ judul, onTutup, bagian, children }: Props) {
  return (
    <Panel judul={judul} onTutup={onTutup}>
      {bagian.map((b, i) => (
        <section key={b.judul ?? i} style={{ display: 'flex', flexDirection: 'column', gap: token.jarak.sm }}>
          {b.judul && <h3 style={{ margin: 0, fontSize: token.huruf.ukuran.besar, fontWeight: token.huruf.berat.tebal }}>{b.judul}</h3>}
          <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'max-content 1fr', columnGap: token.jarak.md, rowGap: token.jarak.sm }}>
            {b.baris.map((r) => (
              <div key={r.label} style={{ display: 'contents' }}>
                <dt style={{ color: token.warna.teksRedup }}>{r.label}</dt>
                <dd style={{ margin: 0, fontWeight: token.huruf.berat.sedang, overflowWrap: 'anywhere' }}>{r.nilai}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
      {children}
    </Panel>
  );
}
