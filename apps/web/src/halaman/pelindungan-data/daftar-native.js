import { PDP } from '@klira/shared';
import { token } from '../../gaya/token.js';
import { buatDaftar } from '../../util/use-daftar.js';
import { kartu, tabel, peringatan, paginasi } from '../../komponen/ui/primitif.js';

/** Daftar PDP yang sudah ada: UI tabel berhalaman, galat, kosong, dan muat ulang setelah modal selesai. */
export function pasangDaftarPdp(wadah, { label, kolom, ambil, baris, kosong, aksiAtas, catatan, kepala, saatHasil }) {
  const nodes = [];
  if (aksiAtas) {
    const aksi = document.createElement('div'); Object.assign(aksi.style, { display: 'flex', alignItems: 'center', gap: token.jarak.md, flexWrap: 'wrap', justifyContent: 'flex-end' }); aksi.append(...aksiAtas); nodes.push(aksi);
  }
  const card = kartu({ style: { padding: '0', overflow: 'hidden' } }), pesan = document.createElement('div'), daftar = tabel(kolom, label), kosongEl = document.createElement('div'), nav = document.createElement('div');
  pesan.style.display = kosongEl.style.display = nav.style.display = 'contents';
  if (kepala) card.append(kepala);
  card.append(pesan, daftar.el, kosongEl, nav); nodes.push(card);
  if (catatan) { const p = document.createElement('p'); p.textContent = catatan; Object.assign(p.style, { margin: '0', color: token.warna.teksRedup }); nodes.push(p); }
  wadah.replaceChildren(...nodes);
  const pemuat = buatDaftar(ambil, PDP.gagalMuat, ({ halaman, hasil, galat }) => {
    pesan.replaceChildren(); if (galat) { const alert = peringatan(galat); alert.style.margin = kepala ? `0 ${token.jarak.md} ${token.jarak.md}` : token.jarak.md; pesan.append(alert); }
    daftar.tbody.replaceChildren(...(hasil?.data.map(baris) ?? []));
    kosongEl.replaceChildren(); if (hasil && !hasil.data.length) { const teks = document.createElement('div'); teks.textContent = kosong; Object.assign(teks.style, { padding: token.jarak.md, color: token.warna.teksRedup }); kosongEl.append(teks); }
    nav.replaceChildren(); if (hasil) { const pagination = paginasi(halaman, hasil.total, hasil.ukuran, h => { void pemuat.pindah(h); }); if (pagination) nav.append(pagination); saatHasil?.(hasil); }
  });
  void pemuat.muat();
  return { muat: pemuat.muat, awal: () => pemuat.keadaan.halaman === 1 ? pemuat.muat() : pemuat.pindah(1), tutup() { pemuat.tutup(); wadah.replaceChildren(); } };
}
