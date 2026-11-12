import type { ReactNode } from 'react';
import { PENANDA_NORMAL } from '@klira/shared';
import { Bingkai } from '../ui/kartu';
import { Lencana } from '../ui/lencana';
import { Sebaris, Tumbuh } from '../ui/susunan';

type PropsKelompok = {
  /** Nama kelompok (dibaca pembaca layar); tampil di kepala kecuali `tanpaJudul`. */
  judul: string;
  /** Sembunyikan judul bila isian di dalamnya sudah jelas sendiri (menghindari pengulangan kata). */
  tanpaJudul?: boolean;
  /** Jumlah isian kelompok ini yang berbeda dari default keadaan baik. */
  diubah?: number;
  aksi?: ReactNode;
  children: ReactNode;
};

/** Kelompok isian pemeriksaan dalam kartu bergaris (P6–P8): satu baris kepala (judul, hitungan "n isian diubah", aksi) di atas isian. */
export function KelompokNormal({ judul, tanpaJudul, diubah = 0, aksi, children }: PropsKelompok) {
  return (
    <Bingkai tag="div" role="group" aria-label={judul} arah="kolom" jarak="sm" padding="sm">
      {(!tanpaJudul || aksi || diubah > 0) && (
        <Sebaris bungkus jarak="sm">
          {!tanpaJudul && <strong>{judul}</strong>}
          {diubah > 0 && <Lencana warna="kuning">{PENANDA_NORMAL.jumlahDiubah(diubah)}</Lencana>}
          <Tumbuh />
          {aksi}
        </Sebaris>
      )}
      {children}
    </Bingkai>
  );
}
