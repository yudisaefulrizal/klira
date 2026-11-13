import { token } from '../../gaya/token.js';
import { bukaPanel } from './panel.js';
export function bukaPanelDetail({ judul, onTutup, bagian, children }) {
  const panel = bukaPanel({ judul, onTutup });
  function perbarui(bagianBaru, isiTambahan) {
  panel.isi.replaceChildren();
  for (const b of bagianBaru) {
    const section = document.createElement('section'); Object.assign(section.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.sm });
    if (b.judul) { const h = document.createElement('h3'); h.textContent = b.judul; Object.assign(h.style, { margin: '0', fontSize: token.huruf.ukuran.besar, fontWeight: token.huruf.berat.tebal }); section.append(h); }
    const dl = document.createElement('dl'); Object.assign(dl.style, { margin: '0', display: 'grid', gridTemplateColumns: 'max-content 1fr', columnGap: token.jarak.md, rowGap: token.jarak.sm });
    for (const r of b.baris) { const row = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd'); row.style.display = 'contents'; dt.textContent = r.label; dt.style.color = token.warna.teksRedup; if (r.nilai !== null && r.nilai !== undefined) dd.append(r.nilai); Object.assign(dd.style, { margin: '0', fontWeight: token.huruf.berat.sedang, overflowWrap: 'anywhere' }); row.append(dt, dd); dl.append(row); }
    section.append(dl); panel.isi.append(section);
  }
  if (isiTambahan) panel.isi.append(...[isiTambahan].flat(Infinity));
  }
  perbarui(bagian, children); return { ...panel, perbarui };
}
