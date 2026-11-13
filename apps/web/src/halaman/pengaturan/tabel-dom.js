import { token } from '../../gaya/token.js';
import { kartu, tabel, peringatan } from '../../komponen/ui/native.js';
/** Susunan tabel tab administrasi dari komponen UI yang sama; tanpa state atau renderer. */
export function tabelTab({ id, label, kolom, catatan }) {
  const el = document.createElement('section'), card = kartu({ style: { padding: '0', overflow: 'hidden' } }), kepala = document.createElement('div'), pesan = document.createElement('div'), kosong = document.createElement('div'), nav = document.createElement('div'), table = tabel(kolom, label);
  el.id = `panel-${id}`; el.setAttribute('role', 'tabpanel'); el.setAttribute('aria-labelledby', `tab-${id}`); Object.assign(el.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md });
  Object.assign(kepala.style, { display: 'flex', alignItems: 'flex-end', flexWrap: 'wrap', gap: token.jarak.md, padding: token.jarak.md }); pesan.style.display = kosong.style.display = nav.style.display = 'contents'; card.append(kepala, pesan, table.el, kosong, nav); el.append(card); if (catatan) el.append(peringatan(catatan, 'kuning'));
  return { el, kepala, tbody: table.tbody, pesan, kosong, nav,
    galat(teks) { pesan.replaceChildren(); if (teks) { const alert = peringatan(teks); alert.style.margin = `0 ${token.jarak.md} ${token.jarak.md}`; pesan.append(alert); } },
    kosongkan(tampil, teks) { kosong.replaceChildren(); if (tampil) { const div = document.createElement('div'); div.textContent = teks; Object.assign(div.style, { padding: token.jarak.md, color: token.warna.teksRedup }); kosong.append(div); } },
  };
}
