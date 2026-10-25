import type { ReactNode } from 'react';
import { MODAL } from '@klira/shared';
import { token } from '../../gaya/token';
import { useLapisanRiwayat } from '../../util/navigasi';
import { Dialog, KepalaDialog } from '../ui/dialog';

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
      <div style={{ padding: token.jarak.lg, display: 'flex', flexDirection: 'column', gap: token.jarak.md, overflowY: 'auto', flexGrow: 1 }}>{children}</div>
      {aksi && <footer style={{ padding: token.jarak.md, borderTop: `${token.ukuran.garis} solid ${token.warna.garis}`, display: 'flex', justifyContent: 'flex-end', gap: token.jarak.sm }}>{aksi}</footer>}
    </Dialog>
  );
}
