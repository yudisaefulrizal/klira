import { useState } from 'react';
import type { ReactNode } from 'react';
import { MODAL, TOMBOL } from '@klira/shared';
import { token } from '../../gaya/token';
import { alasanSiap } from '../../util/alasan';
import { AreaTeks } from '../ui/area-teks';
import { Dialog } from '../ui/dialog';
import { Tombol } from '../ui/tombol';
import { Kolom, Sebaris } from '../ui/susunan';

type Props = {
  judul: string;
  pesan: ReactNode;
  labelYa?: string;
  labelTidak?: string;
  /** Tampilkan isian alasan; `wajib` menahan tombol Ya sampai terisi (untuk yang wajib dan tercatat, pakai Peringatan). */
  alasan?: false | { label?: string; wajib?: boolean };
  memproses?: boolean;
  onYa: (alasan: string) => void;
  onTidak: () => void;
};

/** Konfirmasi: dialog ya/tidak singkat (3.2). Esc sama dengan Tidak. Dipakai nonaktifkan, batalkan, ekspor, kirim, tutup dengan draf. */
export function Konfirmasi({ judul, pesan, labelYa = TOMBOL.konfirmasi, labelTidak = MODAL.batal, alasan = false, memproses, onYa, onTidak }: Props) {
  const [teks, setTeks] = useState('');
  const siap = alasanSiap(teks, !!alasan && !!alasan.wajib) && !memproses;
  return (
    <Dialog judul={judul} onEsc={onTidak} lapis="konfirmasi" lebar="modalKecil">
      <Kolom tag="form" jarak="md" padding="lg"
        onSubmit={(e) => {
          e.preventDefault();
          if (siap) onYa(teks.trim());
        }}
      >
        <h2 style={{ margin: 0, fontSize: token.huruf.ukuran.besar, fontWeight: token.huruf.berat.tebal }}>{judul}</h2>
        <div style={{ color: token.warna.teksRedup }}>{pesan}</div>
        {alasan && <AreaTeks id="alasan-konfirmasi" label={alasan.label ?? MODAL.alasanOpsional} value={teks} onChange={(e) => setTeks(e.target.value)} />}
        <Sebaris jarak="sm" sejajar="regang" sebaran="akhir">
          <Tombol type="button" varian="sekunder" onClick={onTidak}>{labelTidak}</Tombol>
          <Tombol type="submit" disabled={!siap}>{labelYa}</Tombol>
        </Sebaris>
      </Kolom>
    </Dialog>
  );
}
