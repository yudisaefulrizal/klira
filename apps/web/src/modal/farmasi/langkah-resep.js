import { FARMASI } from '@klira/shared';
import { token } from '../../gaya/token.js';
import { izinSaatIni } from '../../komponen/izin/izin-saja.js';
import { bidang, peringatan } from '../../komponen/ui/primitif.js';
import { EditorItemResep } from './editor-item-resep.js';
import { barisResepDokter } from './keadaan-farmasi.js';

const R = FARMASI.resep;

/**
 * Resep dokter: obat dipilih satu per satu dari master obat klinik (jumlah dan aturan pakai ditulis dokter), lalu satu catatan untuk seluruh resep
 * (mis. cara membuat puyer). Perubahan dilaporkan lewat `onUbah({ baris? , catatan? })`; induk menyimpannya sebagai draf resep.
 */
export function LangkahResep({ resep, obat, onUbah, galat = {}, tampilGalat, disabled }) {
  const el = document.createElement('div');
  Object.assign(el.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md });
  if (!izinSaatIni()('resep', 'input')) { el.append(peringatan(R.tanpaIzin, 'biru')); return el; }
  const editor = EditorItemResep({
    idAwal: 'resep-dokter', baris: resep.baris, obat, galat, tampilGalat, disabled, ringkas: true, judul: '', petunjuk: '', barisBaru: barisResepDokter,
    onUbah(baris) { onUbah({ baris }); },
  });
  const catatan = bidang({ id: 'resep-catatan', label: R.catatan, jenis: 'textarea', nilai: resep.catatan, maxLength: 1000, ubah(v) { onUbah({ catatan: v }); } });
  // Label cukup untuk pembaca layar; yang terlihat hanya placeholder.
  Object.assign(catatan.el.firstElementChild.style, { position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' });
  catatan.kontrol.placeholder = R.catatanContoh; catatan.kontrol.rows = 3; catatan.kontrol.disabled = !!disabled;
  if (tampilGalat) catatan.setGalat(galat.catatan);
  el.append(editor, catatan.el);
  el.tutup = () => editor.tutup();
  return el;
}
