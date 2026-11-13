import { MODAL } from '@klira/shared';
import { token } from '../../gaya/token.js';
import { bukaDialog } from '../ui/dialog-dom.js';
import { KepalaDialog } from '../ui/dialog.js';
import { bukaLapisanRiwayat } from '../../util/riwayat-lapisan.js';
export function bukaPanel({ judul, onTutup, aksi, children }) {
  const dialog = bukaDialog({ judul, onEsc: onTutup, letak: 'kanan', lebar: 'panelSamping' });
  const isi = document.createElement('div'); Object.assign(isi.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md, padding: token.jarak.lg, overflowY: 'auto', flexGrow: '1' });
  isi.append(...[children].flat(Infinity).filter(x => x !== null && x !== undefined && x !== false)); dialog.isi.append(KepalaDialog({ judul, onTutup, labelTutup: MODAL.panelTutup }), isi);
  if (aksi) { const footer = document.createElement('footer'); Object.assign(footer.style, { display: 'flex', gap: token.jarak.sm, padding: token.jarak.md, alignItems: 'stretch', justifyContent: 'flex-end', borderTop: `${token.ukuran.garis} solid ${token.warna.garis}` }); footer.append(...[aksi].flat(Infinity)); dialog.isi.append(footer); }
  const lepas = bukaLapisanRiwayat(window, () => { onTutup(); return true; }); dialog.fokus(); let ditutup = false;
  return { isi, tutup() { if (ditutup) return; ditutup = true; lepas(); dialog.tutup(); } };
}
