import { token } from '../../gaya/token.js';
import { KEAMANAN } from '@klira/shared';
import { totalHalaman } from '../../util/penyaring-tab.js';

/** Primitif DOM UI yang sudah ada: menerima teks/Node dan mengembalikan elemen browser. */
export function tombol(teks, onClick, varian = 'utama') {
  const el = document.createElement('button'); el.type = 'button'; el.textContent = teks; el.className = 'ui-native-tombol';
  Object.assign(el.style, { height: token.ukuran.tombol, padding: `0 ${token.jarak.md}`, borderRadius: token.radius.sedang, fontFamily: token.huruf.keluarga, fontSize: token.huruf.ukuran.dasar, fontWeight: token.huruf.berat.sedang,
    background: varian === 'utama' ? token.warna.utama : varian === 'sekunder' ? token.warna.permukaan : 'transparent', color: varian === 'utama' ? token.warna.diAtasUtama : token.warna.utama, border: varian === 'sekunder' ? `${token.ukuran.garis} solid ${token.warna.garis}` : 'none' });
  if (onClick) el.addEventListener('click', onClick); return el;
}
export function kartu({ susun, style } = {}) {
  const el = document.createElement('div'); Object.assign(el.style, { background: token.warna.permukaan, border: `${token.ukuran.garis} solid ${token.warna.garis}`, borderRadius: token.radius.besar, boxShadow: token.bayangan.kartu, padding: token.jarak.lg,
    ...(susun ? { display: 'flex', flexDirection: 'column', gap: token.jarak[susun] } : {}), ...style }); return el;
}
export function lencana(teks, warna) {
  const el = document.createElement('span'); el.textContent = teks; const w = token.warna.status[warna];
  Object.assign(el.style, { display: 'inline-block', padding: `${token.jarak.xs} ${token.jarak.sm}`, borderRadius: token.radius.pil, background: w?.latar, color: w?.teks, fontSize: token.huruf.ukuran.kecil, fontWeight: token.huruf.berat.tebal }); return el;
}
export function peringatan(teks, nada = 'merah') {
  const el = document.createElement('div'); el.textContent = teks; el.setAttribute('role', 'alert'); const w = token.warna.status[nada];
  Object.assign(el.style, { background: w.latar, color: w.teks, padding: token.jarak.sm, borderRadius: token.radius.sedang, fontSize: token.huruf.ukuran.dasar }); return el;
}
export function bidang({ id, label, jenis = 'text', nilai = '', opsi, ubah, autoComplete, maxLength }) {
  const el = document.createElement('div'), judul = document.createElement('label'); judul.htmlFor = id; judul.textContent = label;
  Object.assign(el.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.xs }); Object.assign(judul.style, { fontSize: token.huruf.ukuran.dasar, fontWeight: token.huruf.berat.sedang, padding: '0' });
  const kontrol = document.createElement(opsi ? 'select' : jenis === 'textarea' ? 'textarea' : 'input'); kontrol.id = id;
  if (kontrol.tagName === 'INPUT') kontrol.type = jenis;
  if (autoComplete !== undefined) kontrol.autocomplete = autoComplete;
  if (maxLength !== undefined) kontrol.maxLength = maxLength;
  if (opsi) for (const o of opsi) { const option = document.createElement('option'); option.value = o.nilai; option.textContent = o.label; kontrol.append(option); }
  Object.assign(kontrol.style, { height: token.ukuran.isian, padding: `0 ${token.jarak.sm}`, border: `${token.ukuran.garis} solid ${token.warna.garis}`, borderRadius: token.radius.sedang, background: token.warna.permukaan, color: token.warna.teks, fontFamily: token.huruf.keluarga, fontSize: token.huruf.ukuran.dasar });
  if (jenis === 'textarea') Object.assign(kontrol.style, { height: token.ukuran.areaTeks, padding: token.jarak.sm, resize: 'vertical' });
  kontrol.value = nilai; if (ubah) kontrol.addEventListener(opsi ? 'change' : 'input', e => ubah(e.target.value));
  const galat = document.createElement('span'); galat.id = `${id}-galat`; galat.setAttribute('role', 'alert'); galat.hidden = true;
  Object.assign(galat.style, { color: token.warna.status.merah.teks, fontSize: token.huruf.ukuran.kecil }); el.append(judul, kontrol, galat);
  return { el, kontrol, setGalat(pesan) {
    galat.textContent = pesan ?? ''; galat.hidden = !pesan; kontrol.style.borderColor = pesan ? token.warna.status.merah.teks : token.warna.garis;
    if (pesan) { kontrol.setAttribute('aria-invalid', 'true'); kontrol.setAttribute('aria-describedby', galat.id); }
    else { kontrol.removeAttribute('aria-invalid'); kontrol.removeAttribute('aria-describedby'); }
  } };
}
export function sel(...isi) { const el = document.createElement('td'); Object.assign(el.style, { padding: token.jarak.md, verticalAlign: 'top' }); el.append(...isi.filter(x => x !== null && x !== undefined && x !== false)); return el; }
export function baris(...isi) { const el = document.createElement('tr'); el.style.borderTop = `${token.ukuran.garis} solid ${token.warna.garisHalus}`; el.append(...isi); return el; }
export function tabel(kolom, label) {
  const el = document.createElement('div'), table = document.createElement('table'), thead = document.createElement('thead'), tr = document.createElement('tr'), tbody = document.createElement('tbody');
  el.style.overflowX = 'auto'; table.setAttribute('aria-label', label); Object.assign(table.style, { width: '100%', borderCollapse: 'collapse', fontSize: token.huruf.ukuran.dasar, minWidth: token.ukuran.tabelMin });
  Object.assign(tr.style, { background: token.warna.kepalaTabel, textAlign: 'left', color: token.warna.teksMenu, fontSize: token.huruf.ukuran.kecil });
  for (const k of kolom) { const th = document.createElement('th'); th.scope = 'col'; th.textContent = k.judul; Object.assign(th.style, { padding: `${token.jarak.sm} ${token.jarak.md}`, fontWeight: token.huruf.berat.tebal, textAlign: k.rataKanan ? 'right' : 'left' }); tr.append(th); }
  thead.append(tr); table.append(thead, tbody); el.append(table); return { el, tbody };
}
export function paginasi(halaman, total, ukuran, pindah) {
  if (total <= ukuran) return null;
  const el = document.createElement('nav'); el.setAttribute('aria-label', 'Paginasi'); Object.assign(el.style, { display: 'flex', alignItems: 'center', gap: token.jarak.md, padding: token.jarak.md, justifyContent: 'flex-end' });
  const jumlah = totalHalaman(total, ukuran), sebelum = tombol(KEAMANAN.sebelumnya, () => pindah(halaman - 1), 'sekunder'), berikut = tombol(KEAMANAN.berikutnya, () => pindah(halaman + 1), 'sekunder');
  sebelum.disabled = halaman <= 1; berikut.disabled = halaman >= jumlah; const nomor = document.createElement('span'); nomor.textContent = `${halaman} / ${jumlah}`; el.append(sebelum, nomor, berikut); return el;
}
export function tab(daftar, aktif, label, onPilih) {
  const el = document.createElement('div'); el.setAttribute('role', 'tablist'); el.setAttribute('aria-label', label);
  Object.assign(el.style, { display: 'flex', flexWrap: 'wrap', gap: token.jarak.sm });
  const tombolTab = new Map();
  for (const item of daftar) {
    const button = document.createElement('button'); button.type = 'button'; button.id = `tab-${item.id}`; button.setAttribute('role', 'tab'); button.setAttribute('aria-controls', `panel-${item.id}`); button.textContent = item.label;
    Object.assign(button.style, { height: token.ukuran.tab, padding: `0 ${token.jarak.md}`, borderRadius: token.radius.pil, cursor: 'pointer', fontFamily: token.huruf.keluarga, fontSize: token.huruf.ukuran.dasar });
    button.addEventListener('click', () => onPilih(item.id)); tombolTab.set(item.id, button); el.append(button);
  }
  function pilih(id) {
    for (const [key, button] of tombolTab) { const on = key === id;
      button.setAttribute('aria-selected', String(on)); Object.assign(button.style, { border: `${token.ukuran.garis} solid ${on ? token.warna.utama : token.warna.garisIsian}`, background: on ? token.warna.utama : token.warna.permukaan, color: on ? token.warna.diAtasUtama : token.warna.teks, fontWeight: on ? token.huruf.berat.tebal : token.huruf.berat.biasa });
    }
  }
  pilih(aktif); return { el, pilih };
}
