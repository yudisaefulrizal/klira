import type { ReactNode } from 'react';
import { token } from '../../gaya/token';
import { Panel } from '../panel/panel';
import { Kisi, Kolom, PasanganRingkasan } from '../ui/susunan';

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
        <Kolom tag="section" jarak="sm" key={b.judul ?? i}>
          {b.judul && <h3 style={{ margin: 0, fontSize: token.huruf.ukuran.besar, fontWeight: token.huruf.berat.tebal }}>{b.judul}</h3>}
          <Kisi tag="dl" kolom="max-content 1fr" jarakBaris="sm">
            {b.baris.map((r) => (
              <PasanganRingkasan key={r.label} label={r.label} nilai={r.nilai} />
            ))}
          </Kisi>
        </Kolom>
      ))}
      {children}
    </Panel>
  );
}
