import { MODAL } from '@klira/shared';
import { token } from '../../gaya/token.js';
import { bukaDialog } from './buka-dialog.js';
import { tombol } from './primitif.js';
export { bukaDialog };
export function KepalaDialog({ judul, onTutup, labelTutup = MODAL.tutup, children, className }) {
  const header = document.createElement('header'), h2 = document.createElement('h2'), slot = document.createElement('div');
  if (className) header.className = className;
  Object.assign(header.style, { display: 'flex', alignItems: 'center', gap: token.jarak.lg, padding: `${token.jarak.md} ${token.jarak.lg}`, background: token.warna.kepalaTabel, borderBottom: `${token.ukuran.garis} solid ${token.warna.garis}` });
  h2.textContent = judul; Object.assign(h2.style, { margin: '0', fontSize: token.huruf.ukuran.judul, fontWeight: token.huruf.berat.tebal });
  Object.assign(slot.style, { flexGrow: '1', display: 'flex', alignItems: 'center', gap: token.jarak.lg, minWidth: '0' }); slot.append(...[children].flat(Infinity).filter(x => x !== null && x !== undefined && x !== false));
  const close = tombol('', onTutup, 'sekunder'); close.setAttribute('aria-label', labelTutup); close.title = labelTutup; Object.assign(close.style, { padding: '0', width: token.ukuran.tombol });
  close.innerHTML = '<svg width="16px" height="16px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg>';
  header.append(h2, slot, close); return header;
}
