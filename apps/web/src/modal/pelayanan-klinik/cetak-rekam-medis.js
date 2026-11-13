import { KLINIS } from '@klira/shared';
import { ambilRekamMedisCetak } from '../../api-klien/klinis.js';
import { GalatApi } from '../../api-klien/klien.js';
import { tombol, peringatan } from '../../komponen/ui/native.js';
import { Lembar } from './lembar-rekam-medis.js';
import { muatDataRawatInap } from './data-rawat-inap.js';

export function bukaCetakRekamMedis({ kunjunganId, onTutup }) {
  const C = KLINIS.cetak, el = document.createElement('div'), outils = document.createElement('div'), title = document.createElement('strong'), espace = document.createElement('span'), contenu = document.createElement('div'), avant = document.activeElement;
  let aktif = true;
  if (!document.querySelector('link[data-cetak-rm]')) { const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = new URL('./cetak-rekam-medis.css', import.meta.url).href; css.dataset.cetakRm = ''; document.head.append(css); }
  el.className = 'crm-lapis'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', C.judul); outils.className = 'crm-alat'; title.textContent = C.judul; espace.className = 'crm-tumbuh';
  function detruire() { aktif = false; document.removeEventListener('keydown', clavier); el.remove(); if (avant?.isConnected) avant.focus(); }
  function fermer() { detruire(); onTutup(); }
  function clavier(e) { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); fermer(); } if (e.key === 'Tab') { const nodes = [...el.querySelectorAll('button:not([disabled]),a[href],input:not([disabled])')]; const premier = nodes[0], dernier = nodes.at(-1); if (e.shiftKey && document.activeElement === premier) { e.preventDefault(); dernier?.focus(); } else if (!e.shiftKey && document.activeElement === dernier) { e.preventDefault(); premier?.focus(); } } }
  const close = tombol(C.tutup, fermer, 'sekunder'), print = tombol(C.cetak, () => window.print()); print.disabled = true; outils.append(title, espace, close, print); const loading = document.createElement('p'); loading.className = 'crm-memuat'; loading.textContent = C.memuat; contenu.append(loading); el.append(outils, contenu); document.body.append(el); document.addEventListener('keydown', clavier); close.focus();
  ambilRekamMedisCetak(kunjunganId).then(async d => { const inap = d.klinis.kunjungan.jenis === 'IMP' ? await muatDataRawatInap(kunjunganId) : null; if (aktif) { contenu.replaceChildren(Lembar({ d, inap })); print.disabled = false; } }).catch(e => { if (aktif) contenu.replaceChildren(peringatan(e instanceof GalatApi ? e.message : C.gagal)); }); return { tutup: detruire };
}
