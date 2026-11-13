import { token } from '../../gaya/token.js';

export function KotakCentang({ id, label, keterangan, style, ...sisa }) {
  const el = document.createElement('div');
  Object.assign(el.style, { display: 'flex', gap: token.jarak.sm, alignItems: 'flex-start', ...style });
  const input = document.createElement('input');
  input.id = id;
  input.type = 'checkbox';
  Object.assign(input.style, { marginTop: token.jarak.xs, accentColor: token.warna.utama });
  for (const [name, value] of Object.entries(sisa)) {
    if (value === undefined || value === null || name === 'children' || name === 'key') continue;
    if (/^on[A-Z]/.test(name)) {
      const capture = name.endsWith('Capture');
      input.addEventListener(name.slice(2, capture ? -7 : undefined).toLowerCase(), value, capture);
    } else if (name === 'ref') {
      if (typeof value === 'function') value(input);
      else value.current = input;
    } else if (name === 'defaultChecked') input.checked = value;
    else if (name in input && !name.startsWith('aria-') && !name.startsWith('data-')) input[name] = value;
    else if (value !== false || name.startsWith('aria-') || name.startsWith('data-')) input.setAttribute(name, String(value));
  }
  const judul = document.createElement('label');
  judul.htmlFor = id;
  Object.assign(judul.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.xs, cursor: 'pointer' });
  const nama = document.createElement('span');
  nama.style.fontWeight = token.huruf.berat.sedang;
  nama.append(...[label].flat(Infinity).filter(v => v !== undefined && v !== null && v !== false));
  judul.append(nama);
  if (keterangan) {
    const petunjuk = document.createElement('span');
    Object.assign(petunjuk.style, { fontSize: token.huruf.ukuran.kecil, color: token.warna.teksRedup });
    petunjuk.append(keterangan);
    judul.append(petunjuk);
  }
  el.append(input, judul);
  return el;
}
