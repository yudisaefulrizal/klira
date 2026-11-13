import { jelajahKamus } from '../../../api-klien/klinis.js';
import { token } from '../../../gaya/token.js';
import { bukaPanel } from '../../panel/panel.js';
import { tombol, peringatan, paginasi } from '../../ui/primitif.js';
import { daftarHasilKode } from './hasil-kode.js';
export function bukaKamusKode({ judul, sistem, onTutup, onPilih }) {
  let halaman = 1, awalan = '', versi = 0, aktif = true;
  const panel = bukaPanel({ judul, onTutup }), kepala = document.createElement('div'), indeks = document.createElement('div'), hasil = document.createElement('div');
  Object.assign(kepala.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.sm }); hasil.style.display = 'contents';
  const info = document.createElement('span'); info.style.color = token.warna.teksRedup; info.textContent = 'Pilih kode dari referensi yang tersedia.'; kepala.append(info);
  if (sistem === 'icd10' || sistem === 'icd9cm') { const note = document.createElement('small'); note.style.color = token.warna.teksRedup; note.textContent = sistem === 'icd10' ? 'Padanan Indonesia dari komunitas, belum diverifikasi klinis. Nama resmi Inggris tetap ditampilkan.' : 'Nama tindakan Indonesia mengikuti pemetaan KPTL SATUSEHAT; bukan terjemahan harfiah ICD-9-CM.'; kepala.append(note); }
  Object.assign(indeks.style, { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: token.jarak.xs }); indeks.setAttribute('role', 'group'); indeks.setAttribute('aria-label', 'Awalan kode'); kepala.append(indeks); panel.isi.append(kepala, hasil);
  function filter() {
    indeks.replaceChildren();
    for (const huruf of ['', ...(sistem === 'icd10' ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' : '0123456789')]) {
      const button = tombol(huruf || 'Semua', () => { if (huruf === awalan && halaman === 1) return; awalan = huruf; halaman = 1; filter(); void muat(); }, huruf === awalan ? 'utama' : 'sekunder');
      button.setAttribute('aria-pressed', String(huruf === awalan)); Object.assign(button.style, { minWidth: '32px', padding: '0 8px', height: '32px' }); indeks.append(button);
    }
  }
  async function muat() {
    const saat = ++versi; hasil.replaceChildren(); const loading = document.createElement('span'); loading.setAttribute('role', 'status'); loading.textContent = 'Memuat kamus…'; hasil.append(loading);
    try {
      const h = await jelajahKamus(sistem, halaman, awalan); if (!aktif || saat !== versi) return; hasil.replaceChildren();
      const total = document.createElement('small'); total.setAttribute('role', 'status'); total.style.color = token.warna.teksRedup; total.textContent = `${h.total} kode${awalan ? ` dengan awalan ${awalan}` : ''}`; hasil.append(total);
      if (!h.data.length) { const p = document.createElement('p'); p.style.margin = '0'; p.textContent = 'Belum ada kode pada bagian ini.'; hasil.append(p); }
      hasil.append(daftarHasilKode(h.data, { label: 'Daftar kode kamus', onPilih, kamus: true }));
      const nav = paginasi(h.halaman, h.total, h.ukuran, n => { halaman = n; void muat(); }); if (nav) hasil.append(nav);
    } catch (e) { if (aktif && saat === versi) hasil.replaceChildren(peringatan(e instanceof Error ? e.message : 'Kamus gagal dimuat.'), tombol('Coba lagi', () => void muat(), 'sekunder')); }
  }
  filter(); void muat(); return () => { aktif = false; versi++; panel.tutup(); };
}
