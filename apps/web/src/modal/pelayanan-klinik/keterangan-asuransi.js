import { KUNJUNGAN } from '@klira/shared';
import { detailPasien } from '../../api-klien/pasien.js';
import { peringatan } from '../../komponen/ui/native.js';
import { DaftarRingkasan } from '../../komponen/ui/susunan.js';
import { keteranganAsuransi } from './keadaan-kunjungan.js';

export function KeteranganAsuransi({ pasienId }) {
  const el = document.createElement('div'), T = KUNJUNGAN.asuransi;
  let aktif = true, versi = 0;
  el.style.display = 'contents';
  async function muat(id) { const saat = ++versi; el.replaceChildren(); let pasien = null; try { pasien = await detailPasien(id); } catch {} if (!aktif || saat !== versi) return; const ket = keteranganAsuransi(pasien); el.append(ket ? DaftarRingkasan({ bagian: [{ judul: T.judul, baris: [{ label: T.nama, nilai: ket.nama ?? '-' }, { label: T.polis, nilai: ket.polis ?? '-' }] }] }) : peringatan(T.belumAda, 'kuning')); }
  el.perbarui = ({ pasienId: id }) => muat(id); el.tutup = () => { aktif = false; versi++; }; void muat(pasienId); return el;
}
