import { token } from '../../../gaya/token.js';
import { tombol, lencana } from '../../ui/primitif.js';
export function daftarHasilKode(hasil, { label, onPilih, kamus = false, labelContoh = 'Contoh' }) {
  const ul = document.createElement('ul'); ul.setAttribute('aria-label', label);
  Object.assign(ul.style, { display: 'flex', flexDirection: 'column', gap: '0', listStyle: 'none', margin: '0', padding: '0', ...(kamus ? {} : { overflow: 'hidden', border: `${token.ukuran.garis} solid ${token.warna.garis}`, borderRadius: token.radius.sedang }) });
  for (const h of hasil) {
    const li = document.createElement('li'), kode = document.createElement('strong'), teks = document.createElement('span');
    if (kamus) li.style.borderBottom = `1px solid ${token.warna.garis}`; else li.style.borderTop = `${token.ukuran.garis} solid ${token.warna.garisHalus}`;
    kode.textContent = h.kode; kode.style.minWidth = kamus ? '64px' : token.ukuran.kolomKode;
    Object.assign(teks.style, { flex: '1', overflowWrap: 'anywhere' }); teks.append(h.nama_indonesia ?? h.nama);
    const tambah = isi => { const small = document.createElement('small'); small.textContent = isi; Object.assign(small.style, { display: 'block', color: token.warna.teksRedup }); teks.append(small); };
    if (h.nama_indonesia) tambah(h.nama + (kamus ? '' : ' · Padanan komunitas'));
    if (h.keterangan) tambah(h.keterangan);
    for (const n of h.nama_tindakan_kptl ?? []) tambah(`Nama tindakan KPTL: ${n.nama} (${n.kode})`);
    const button = tombol('', () => onPilih(h), 'teks');
    Object.assign(button.style, { display: 'flex', alignItems: kamus ? 'flex-start' : 'center', gap: kamus ? '12px' : token.jarak.sm, width: '100%', height: 'auto', padding: token.jarak.sm, textAlign: 'left', color: token.warna.teks, fontWeight: token.huruf.berat.biasa });
    button.append(kode, teks); if (h.contoh) button.append(lencana(labelContoh, 'kuning')); li.append(button); ul.append(li);
  }
  return ul;
}
