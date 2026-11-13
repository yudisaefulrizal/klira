import { DAFTAR_PASIEN } from '@klira/shared';
import { token } from '../../gaya/token.js';

/** Identitas pasien singkat di kepala modal kerja per pasien (lab, persetujuan): nama dan nomor RM. */
export function KepalaPasien({ nama, nomorRm }) {
  const el = document.createElement('div');
  const namaEl = document.createElement('div');
  namaEl.textContent = nama;
  Object.assign(namaEl.style, {
    fontSize: token.huruf.ukuran.besar,
    fontWeight: token.huruf.berat.tebal,
  });
  const nomorRmEl = document.createElement('div');
  nomorRmEl.textContent = `${DAFTAR_PASIEN.kolom.nomorRm} ${nomorRm}`;
  Object.assign(nomorRmEl.style, {
    color: token.warna.teksMenu,
    fontSize: token.huruf.ukuran.dasar,
  });
  el.append(namaEl, nomorRmEl);
  return el;
}
