import type { ReactNode } from 'react';
import { MODAL } from '@klira/shared';
import { useLapisanRiwayat } from '../../util/navigasi';
import { Dialog, KepalaDialog } from '../ui/dialog';
import { Kolom, Sebaris } from '../ui/susunan';

type Props = { judul: string; onTutup: () => void; aksi?: ReactNode; children: ReactNode };

/**
 * PANEL (3.2): panel samping untuk riwayat atau info pendamping tanpa meninggalkan langkah. Tombol kembali peramban
 * menutup panel lebih dahulu (5.1j), lalu modal di bawahnya.
 */
export function Panel({ judul, onTutup, aksi, children }: Props) {
  useLapisanRiwayat(true, () => {
    onTutup();
    return true;
  });
  return (
    <Dialog judul={judul} onEsc={onTutup} letak="kanan" lebar="panelSamping" lapis="dialog">
      <KepalaDialog judul={judul} onTutup={onTutup} labelTutup={MODAL.panelTutup} />
      <Kolom jarak="md" padding="lg" style={{ overflowY: 'auto', flexGrow: 1 }}>{children}</Kolom>
      {aksi && <Sebaris tag="footer" jarak="sm" padding="md" sejajar="regang" sebaran="akhir" garis="atas">{aksi}</Sebaris>}
    </Dialog>
  );
}
