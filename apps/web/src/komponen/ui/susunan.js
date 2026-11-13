import { token } from '../../gaya/token.js';

const gayaGaris = (garis, halus) => {
  if (!garis) return {};
  const nilai = `${token.ukuran.garis} solid ${halus ? token.warna.garisHalus : token.warna.garis}`;
  return garis === 'atas' ? { borderTop: nilai } : garis === 'kanan' ? { borderRight: nilai } : { borderBottom: nilai };
};
function isi(el, nilai) {
  for (const node of [nilai].flat(Infinity)) {
    if (node !== undefined && node !== null && node !== false && node !== true) el.append(node);
  }
}
function atribut(el, props) {
  for (const [nama, nilai] of Object.entries(props)) {
    if (nilai === undefined || nilai === null || nama === 'key') continue;
    if (nama === 'children') isi(el, nilai);
    else if (nama === 'ref') {
      if (typeof nilai === 'function') nilai(el);
      else nilai.current = el;
    } else if (/^on[A-Z]/.test(nama)) {
      const capture = nama.endsWith('Capture');
      el.addEventListener(nama.slice(2, capture ? -7 : undefined).toLowerCase(), nilai, capture);
    } else if (nama === 'className') el.className = nilai;
    else if (nama === 'style') Object.assign(el.style, nilai);
    else if (nama in el && !nama.startsWith('aria-') && !nama.startsWith('data-')) el[nama] = nilai;
    else if (nilai !== false || nama.startsWith('aria-') || nama.startsWith('data-')) el.setAttribute(nama, String(nilai));
  }
  return el;
}

export function Kolom({ tag = 'div', jarak = 'md', padding, garis, halus, tumbuh, style, ...sisa } = {}) {
  const el = document.createElement(tag);
  Object.assign(el.style, {
    display: 'flex', flexDirection: 'column', gap: jarak === 'tanpa' ? undefined : token.jarak[jarak],
    padding: padding ? token.jarak[padding] : undefined, flexGrow: tumbuh ? '1' : undefined,
    ...gayaGaris(garis, halus), ...style,
  });
  return atribut(el, sisa);
}
const SEJAJAR = { tengah: 'center', dasar: 'baseline', akhir: 'flex-end', awal: 'flex-start', regang: 'stretch' };
const SEBARAN = { awal: undefined, tengah: 'center', akhir: 'flex-end' };
export function Sebaris({ tag = 'div', jarak = 'sm', padding, garis, halus, tumbuh, bungkus = false, sejajar = 'tengah', sebaran = 'awal', sebaris = false, style, ...sisa } = {}) {
  const el = document.createElement(tag);
  Object.assign(el.style, {
    display: sebaris ? 'inline-flex' : 'flex', alignItems: SEJAJAR[sejajar], justifyContent: SEBARAN[sebaran],
    flexWrap: bungkus ? 'wrap' : undefined, gap: jarak === 'tanpa' ? undefined : token.jarak[jarak],
    padding: padding ? token.jarak[padding] : undefined, flexGrow: tumbuh ? '1' : undefined,
    ...gayaGaris(garis, halus), ...style,
  });
  return atribut(el, sisa);
}
export function Kisi({ tag = 'div', kolom, jarak = 'md', jarakBaris, style, ...sisa } = {}) {
  const el = document.createElement(tag);
  Object.assign(el.style, { display: 'grid', gridTemplateColumns: kolom, columnGap: token.jarak[jarak], rowGap: token.jarak[jarakBaris ?? jarak], ...(tag === 'dl' ? { margin: '0' } : {}), ...style });
  return atribut(el, sisa);
}
export function Daftar({ jarak = 'sm', style, ...sisa } = {}) {
  const el = document.createElement('ul');
  Object.assign(el.style, { margin: '0', padding: '0', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: token.jarak[jarak], ...style });
  return atribut(el, sisa);
}
export function Baris(props = {}) {
  return Kisi({ ...props, kolom: `${token.ukuran.kolomKiri} ${token.ukuran.kolomKanan}` });
}
export function PasanganRingkasan({ label, nilai }) {
  const el = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd');
  el.style.display = 'contents';
  dt.style.color = token.warna.teksRedup;
  Object.assign(dd.style, { margin: '0', fontWeight: token.huruf.berat.sedang, overflowWrap: 'anywhere', whiteSpace: 'pre-line' });
  isi(dt, label); isi(dd, nilai); el.append(dt, dd);
  return el;
}
export function DaftarRingkasan({ bagian }) {
  const el = Kolom();
  for (const b of bagian) {
    const section = document.createElement('section'), h = document.createElement('h4'), dl = document.createElement('dl');
    Object.assign(section.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.xs });
    h.textContent = b.judul;
    Object.assign(h.style, { margin: '0', fontSize: token.huruf.ukuran.besar, fontWeight: token.huruf.berat.tebal });
    section.append(h);
    if (!b.baris.length) { const p = document.createElement('p'); p.style.margin = '0'; p.textContent = '—'; section.append(p); }
    Object.assign(dl.style, { margin: '0', display: 'grid', gridTemplateColumns: 'max-content 1fr', columnGap: token.jarak.md, rowGap: token.jarak.xs });
    for (const r of b.baris) dl.append(PasanganRingkasan(r));
    section.append(dl); el.append(section);
  }
  return el;
}
export function Tumbuh({ tag = 'span', style, ...sisa } = {}) {
  const el = document.createElement(tag);
  Object.assign(el.style, { flexGrow: '1', ...style });
  return atribut(el, sisa);
}
