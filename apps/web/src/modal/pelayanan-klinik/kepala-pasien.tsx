import { DAFTAR_PASIEN } from '@klira/shared';
import { token } from '../../gaya/token';

/** Identitas pasien singkat di kepala modal kerja per pasien (lab, persetujuan): nama dan nomor RM. */
export function KepalaPasien({ nama, nomorRm }: { nama: string; nomorRm: string }) {
  return (
    <div>
      <div style={{ fontSize: token.huruf.ukuran.besar, fontWeight: token.huruf.berat.tebal }}>{nama}</div>
      <div style={{ color: token.warna.teksMenu, fontSize: token.huruf.ukuran.dasar }}>{`${DAFTAR_PASIEN.kolom.nomorRm} ${nomorRm}`}</div>
    </div>
  );
}
