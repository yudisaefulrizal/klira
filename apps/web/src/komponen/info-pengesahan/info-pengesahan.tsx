import { KLINIS, STATUS_PENGESAHAN } from '@klira/shared';
import type { BagianKlinisDto } from '@klira/shared';
import { token } from '../../gaya/token';
import { Lencana } from '../ui/lencana';
import { Sebaris } from '../ui/susunan';

/** Keadaan pengesahan satu bagian catatan: lencana status, pengesah, jenis akun, dan versi (dipakai ulang CPPT dan resume nanti). */
export function InfoPengesahan({ bagian }: { bagian: Pick<BagianKlinisDto, 'pengesahan' | 'verifikasi'> | null | undefined }) {
  if (!bagian?.pengesahan) return null;
  const p = bagian.pengesahan;
  return (
    <Sebaris jarak="sm" bungkus style={{ fontSize: token.huruf.ukuran.kecil, color: token.warna.teksRedup }}>
      <Lencana warna={STATUS_PENGESAHAN.warna(bagian.verifikasi)}>{STATUS_PENGESAHAN.label(bagian.verifikasi)}</Lencana>
      <span>{KLINIS.status.disahkanOleh(p.pengguna_nama, p.jenis_akun)}</span>
      <span>{KLINIS.status.versi(p.versi)}</span>
    </Sebaris>
  );
}
