import type { ReactNode } from 'react';
import { PENANDA_NORMAL } from '@klira/shared';
import { token } from '../../gaya/token';
import { Bingkai } from '../ui/kartu';
import { Lencana } from '../ui/lencana';
import { Sebaris, Tumbuh } from '../ui/susunan';
import { Tombol } from '../ui/tombol';

type PropsKelompok = {
  judul: string;
  /** Jumlah isian kelompok ini yang berbeda dari default keadaan baik. */
  diubah?: number;
  /** "Semua normal": kembalikan kelompok ke default. Tanpa ini (kelompok tanpa default) tombol tidak tampil. */
  onNormal?: () => void;
  aksi?: ReactNode;
  disabled?: boolean;
  children: ReactNode;
};

/** Kelompok isian pemeriksaan dalam kartu bergaris (P6–P8): judul, hitungan "n isian diubah", dan tombol "Semua normal". */
export function KelompokNormal({ judul, diubah = 0, onNormal, aksi, disabled, children }: PropsKelompok) {
  return (
    <Bingkai tag="fieldset" arah="kolom" jarak="md" padding="md">
      <legend style={{ padding: `0 ${token.jarak.xs}`, fontWeight: token.huruf.berat.tebal }}>{judul}</legend>
      {(onNormal || aksi || diubah > 0) && (
        <Sebaris bungkus>
          <Tumbuh>{diubah > 0 && <Lencana warna="kuning">{PENANDA_NORMAL.jumlahDiubah(diubah)}</Lencana>}</Tumbuh>
          {aksi}
          {onNormal && <Tombol type="button" varian="sekunder" disabled={disabled || diubah === 0} onClick={onNormal}>{PENANDA_NORMAL.semuaNormal}</Tombol>}
        </Sebaris>
      )}
      {children}
    </Bingkai>
  );
}

/** Bilah ringkas di atas form: total isian yang diubah dan "Kembalikan semua ke normal". */
export function BilahNormal({ diubah, onKembalikan, disabled }: { diubah: number; onKembalikan: () => void; disabled?: boolean }) {
  return (
    <Sebaris bungkus>
      <Tumbuh>
        <span style={{ color: token.warna.teksRedup }}>{PENANDA_NORMAL.petunjuk} </span>
        {diubah > 0 ? <Lencana warna="kuning">{PENANDA_NORMAL.jumlahDiubah(diubah)}</Lencana> : <Lencana warna="hijau">{PENANDA_NORMAL.semuaSesuai}</Lencana>}
      </Tumbuh>
      <Tombol type="button" varian="teks" disabled={disabled || diubah === 0} onClick={onKembalikan}>{PENANDA_NORMAL.kembalikanSemua}</Tombol>
    </Sebaris>
  );
}
