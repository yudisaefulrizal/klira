// Pembangun DOM untuk hasil konversi JSX: h(tag, props, ...anak) mengembalikan elemen/Node (bukan renderer React).
const SVG = new Set(['svg', 'g', 'path', 'line', 'polyline', 'polygon', 'circle', 'ellipse', 'rect', 'text', 'tspan', 'title', 'defs', 'use', 'linearGradient', 'stop', 'clipPath', 'mask']);
const NAMA_ATRIBUT = { className: 'class', htmlFor: 'for' };
const NAMA_PROPERTI = new Set(['value', 'checked', 'disabled', 'selected', 'readOnly', 'required', 'multiple', 'hidden', 'id', 'type', 'name', 'placeholder', 'maxLength', 'min', 'max', 'step', 'rows', 'cols', 'tabIndex', 'autofocus', 'open', 'colSpan', 'rowSpan', 'scope', 'title', 'href', 'target', 'rel', 'role']);
export const Fragment = Symbol('Fragment');

function tambahAnak(induk, anak) {
  for (const n of [anak].flat(Infinity)) {
    if (n === undefined || n === null || n === false || n === true) continue;
    induk.append(n instanceof Node ? n : String(n));
  }
}
const kebab = (s) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

export function h(tag, props, ...anak) {
  props = { ...props };
  if (anak.length) props.children = anak.length === 1 ? anak[0] : anak;
  if (tag === Fragment) { const f = document.createDocumentFragment(); tambahAnak(f, props.children); return f; }
  if (typeof tag === 'function') return tag(props);
  const svg = SVG.has(tag);
  const el = svg ? document.createElementNS('http://www.w3.org/2000/svg', tag) : document.createElement(tag);
  for (const [nama, nilai] of Object.entries(props)) {
    if (nilai === undefined || nilai === null || nama === 'key' || nama === 'children') continue;
    if (nama === 'ref') { if (typeof nilai === 'function') nilai(el); else nilai.current = el; }
    else if (/^on[A-Z]/.test(nama)) {
      const tangkap = nama.endsWith('Capture');
      let ev = nama.slice(2, tangkap ? -7 : undefined).toLowerCase();
      if (ev === 'change' && (el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && !['checkbox', 'radio', 'file', 'range'].includes(el.type)))) ev = 'input';
      el.addEventListener(ev, nilai, tangkap);
    } else if (nama === 'style') { if (typeof nilai === 'string') el.setAttribute('style', nilai); else for (const [p, v] of Object.entries(nilai)) if (v !== undefined && v !== null && v !== false) { if (p.startsWith('--')) el.style.setProperty(p, v); else el.style[p] = v; } }
    else if (nama === 'dangerouslySetInnerHTML') el.innerHTML = nilai.__html;
    else if (!svg && (nama === 'defaultValue')) el.value = nilai;
    else if (!svg && nama === 'className') el.className = nilai;
    else if (!svg && NAMA_PROPERTI.has(nama)) el[nama] = nilai;
    else if (nilai === false && !nama.startsWith('aria-') && !nama.startsWith('data-')) continue;
    else el.setAttribute(svg ? (NAMA_ATRIBUT[nama] ?? (nama.startsWith('aria-') || nama.startsWith('data-') ? nama : kebab(nama))) : (NAMA_ATRIBUT[nama] ?? (nama === 'inputMode' ? 'inputmode' : nama === 'autoComplete' ? 'autocomplete' : nama)), nilai === true && !nama.startsWith('aria-') && !nama.startsWith('data-') ? '' : String(nilai));
  }
  // <select value>: nilai harus diset setelah opsi ada.
  if (props.children !== undefined) tambahAnak(el, props.children);
  if (!svg && el.tagName === 'SELECT' && props.value !== undefined) el.value = props.value;
  return el;
}

/**
 * State lokal untuk satu komponen: render(s, set) dipanggil ulang tiap set(); isi lama diganti, fokus dan seleksi dipulihkan lewat id.
 * Pembungkusnya `display: contents` agar tata letak tidak berubah.
 */
export function lokal(awal, render) {
  const akar = document.createElement('div');
  akar.style.display = 'contents';
  let s = { ...awal };
  const set = (p) => { s = { ...s, ...(typeof p === 'function' ? p(s) : p) }; segarkan(); };
  function segarkan() {
    const aktif = document.activeElement, id = aktif && akar.contains(aktif) ? aktif.id : '';
    const seleksi = id && typeof aktif.selectionStart === 'number' ? [aktif.selectionStart, aktif.selectionEnd] : null;
    akar.replaceChildren(render(s, set));
    if (id) {
      const el = document.getElementById(id);
      el?.focus();
      if (seleksi && el?.setSelectionRange) { try { el.setSelectionRange(...seleksi); } catch { /* tipe tanpa seleksi */ } }
    }
  }
  segarkan();
  akar.set = set;
  return akar;
}
