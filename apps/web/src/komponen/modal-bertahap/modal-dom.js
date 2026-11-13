import { MODAL, TOMBOL } from '@klira/shared';
import { token } from '../../gaya/token.js';
import { batasi, posisiLangkah, statusLangkah } from '../../util/langkah.js';
import { bukaModal1 } from '../modal-1/modal-dom.js';
import { tombol, peringatan } from '../ui/native.js';

/** Modal bertahap native; setiap langkah memasang isi DOM sendiri, tanpa state atau renderer pengganti React. */
export function bukaModalBertahap({ judul, langkah, onKirim, onTutup, lindungiTutup, labelKirim, onLanjut, onIndeks, konteks, catatan, aksiHeader, indeksAwal = 0 }) {
  let indeks = 0, hasil = false, nonaktif = false, galat = '', aktif = true;
  const modal = bukaModal1({ judul, onTutup, lindungiTutup: () => !hasil && lindungiTutup(), lebar: 'modalBesar' });
  if (aksiHeader) modal.konteks.after(aksiHeader);
  if (aksiHeader) modal.konteks.after(aksiHeader);
  const root = modal.isi.parentElement; root.style.height = token.ukuran.tinggiModal;
  modal.aksi.remove(); modal.isi.className = 'modal-langkah-layout';
  Object.assign(modal.isi.style, { flexDirection: 'row', gap: '0', padding: '0', overflow: 'hidden', flexGrow: '1', minHeight: '0', alignItems: 'stretch' });
  const catatanEl = document.createElement('div'); catatanEl.style.display = 'contents';
  const nav = document.createElement('nav'), posLabel = document.createElement('div'), form = document.createElement('form'), section = document.createElement('section'), h3 = document.createElement('h3'), pesan = document.createElement('div'), isi = document.createElement('div'), footer = document.createElement('footer'), posisi = document.createElement('span');
  nav.className = 'modal-langkah-nav'; nav.setAttribute('aria-label', MODAL.daftarLangkah);
  Object.assign(nav.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.xs, borderRight: `${token.ukuran.garis} solid ${token.warna.garis}`, flex: `0 0 ${token.ukuran.navLangkah}`, boxSizing: 'border-box', padding: `${token.jarak.lg} ${token.jarak.md}`, overflowY: 'auto' });
  Object.assign(posLabel.style, { fontSize: token.huruf.ukuran.kecil, fontWeight: token.huruf.berat.tebal, color: token.warna.teksMenu, padding: `0 ${token.jarak.sm} ${token.jarak.sm}`, textTransform: 'uppercase' }); nav.append(posLabel);
  const buttons = langkah.map((l, n) => {
    const button = document.createElement('button'), penanda = document.createElement('span'); button.type = 'button';
    Object.assign(button.style, { display: 'flex', alignItems: 'center', gap: token.jarak.sm, textAlign: 'left', height: 'auto', padding: token.jarak.sm, border: 'none', borderRadius: token.radius.sedang, fontFamily: token.huruf.keluarga, fontSize: token.huruf.ukuran.dasar, cursor: 'pointer' });
    penanda.setAttribute('aria-hidden', 'true'); Object.assign(penanda.style, { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: '0', width: token.ukuran.penandaLangkah, height: token.ukuran.penandaLangkah, borderRadius: token.radius.pil, fontSize: token.huruf.ukuran.kecil });
    button.append(penanda, l.judul); button.addEventListener('click', () => ke(n)); nav.append(button); return { button, penanda };
  });
  form.className = 'modal-langkah-form'; form.noValidate = true; Object.assign(form.style, { display: 'flex', flexDirection: 'column', gap: '0', flex: '1 1 0', minWidth: '0' });
  section.className = 'modal-langkah-isi'; section.setAttribute('aria-labelledby', 'judul-langkah'); Object.assign(section.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md, padding: `${token.jarak.lg} ${token.jarak.xl}`, flexGrow: '1', minHeight: '0', overflowY: 'auto' });
  h3.id = 'judul-langkah'; Object.assign(h3.style, { margin: '0', fontSize: token.huruf.ukuran.judul, fontWeight: token.huruf.berat.tebal }); pesan.style.display = isi.style.display = 'contents'; section.append(h3, catatanEl, pesan, isi);
  Object.assign(footer.style, { display: 'flex', alignItems: 'center', gap: token.jarak.md, padding: token.jarak.md, borderTop: `${token.ukuran.garis} solid ${token.warna.garis}` });
  const kembali = tombol(TOMBOL.kembali, () => ke(indeks - 1), 'sekunder'), kirim = tombol(TOMBOL.lanjut); kirim.type = 'submit';
  Object.assign(posisi.style, { flexGrow: '1', textAlign: 'center', color: token.warna.teksRedup }); footer.append(kembali, posisi, kirim); form.append(section, footer); modal.isi.append(nav, form);
  form.addEventListener('submit', e => { e.preventDefault(); if (indeks === langkah.length - 1) onKirim(); else if (!onLanjut || onLanjut(indeks)) ke(indeks + 1); });
  function perbarui(opsi = {}) {
    if (!aktif || hasil) return;
    if (opsi.labelKirim !== undefined) labelKirim = opsi.labelKirim;
    if (opsi.nonaktif !== undefined) nonaktif = opsi.nonaktif;
    if (opsi.galat !== undefined) galat = opsi.galat;
    const pos = posisiLangkah(indeks, langkah.length), status = statusLangkah(indeks, langkah.length, langkah.map(l => !!l.selesai?.()));
    posLabel.textContent = MODAL.langkahLabel(pos.nomor, pos.dari); posisi.textContent = MODAL.langkah(pos.nomor, pos.dari);
    buttons.forEach(({ button, penanda }, n) => {
      const s = status[n]; if (s === 'aktif') button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current');
      Object.assign(button.style, { background: s === 'aktif' ? token.warna.utamaLatar : 'transparent', color: s === 'aktif' ? token.warna.utamaGelap : token.warna.teks, fontWeight: s === 'aktif' ? token.huruf.berat.tebal : token.huruf.berat.biasa });
      penanda.textContent = s === 'selesai' ? '✓' : String(n + 1); Object.assign(penanda.style, { background: s === 'selesai' ? token.warna.utama : 'transparent', color: s === 'selesai' ? token.warna.diAtasUtama : 'inherit', border: s === 'selesai' ? 'none' : `${token.ukuran.garis} solid ${s === 'aktif' ? token.warna.utama : token.warna.garisIsian}` });
    });
    if (konteks) { const node = typeof konteks === 'function' ? konteks() : konteks; modal.konteks.replaceChildren(...[node].flat(Infinity).filter(x => x !== null && x !== undefined && x !== false)); }
    if (catatan) { const node = typeof catatan === 'function' ? catatan() : catatan; catatanEl.replaceChildren(...[node].flat(Infinity).filter(x => x !== null && x !== undefined && x !== false)); }
    kembali.disabled = indeks === 0; kirim.textContent = indeks === langkah.length - 1 ? labelKirim : TOMBOL.lanjut; kirim.disabled = indeks === langkah.length - 1 && nonaktif;
    pesan.replaceChildren(); if (galat) pesan.append(peringatan(galat));
  }
  function ke(n, { fokus = true, beritahu = true } = {}) {
    if (!aktif || hasil) return; indeks = batasi(n, langkah.length); h3.textContent = langkah[indeks].judul; isi.replaceChildren(langkah[indeks].isi()); perbarui();
    if (beritahu) onIndeks?.(indeks);
    if (fokus) section.querySelector('input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])')?.focus();
  }
  ke(indeksAwal, { beritahu: false });
  return { ke, perbarui,
    hasil({ judul: judulHasil, isi: isiHasil, aksi }) {
      if (!aktif) return; hasil = true; modal.judul.textContent = judulHasil; modal.setLebar('modalSedang'); root.style.height = '';
      modal.isi.className = ''; Object.assign(modal.isi.style, { flexDirection: 'column', gap: token.jarak.md, padding: token.jarak.lg, overflowY: 'auto', flexGrow: '', minHeight: '', alignItems: '' }); modal.isi.replaceChildren(isiHasil); modal.aksi.replaceChildren(...aksi); root.append(modal.aksi);
    },
    tutup() { if (!aktif) return; aktif = false; modal.tutup(); },
  };
}
