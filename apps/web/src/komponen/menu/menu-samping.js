import { HALAMAN_AWAL, NAVIGASI, halamanMenuDiizinkan } from '@klira/shared';
import { token } from '../../gaya/token.js';
import { buatIkonMenu } from './ikon-menu.js';

export function buatMenuSamping(opsi) {
  let pengguna, links = [];
  const el = document.createElement('nav'); el.setAttribute('aria-label', NAVIGASI.menuUtama);
  Object.assign(el.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.xs, borderRight: `${token.ukuran.garis} solid ${token.warna.garis}`, flex: `0 0 ${token.ukuran.menuSamping}`, boxSizing: 'border-box', padding: `${token.jarak.lg} ${token.jarak.md}`, background: token.warna.permukaan });
  function bangun() {
    el.replaceChildren(); links = []; if (!pengguna) return;
    const merek = document.createElement('a'); merek.href = HALAMAN_AWAL.daftarPasien; Object.assign(merek.style, { display: 'flex', alignItems: 'center', gap: token.jarak.sm, padding: `${token.jarak.xs} ${token.jarak.md} ${token.jarak.lg}`, textDecoration: 'none' });
    merek.innerHTML = '<span class="logo-klira logo-klira-asli"><img src="/asset/brand/klira.png" alt="Klira" width="2172" height="724"></span>';
    merek.addEventListener('click', e => { e.preventDefault(); opsi.pindah(HALAMAN_AWAL.daftarPasien); });
    el.append(merek);
    const tersembunyi = new Set([HALAMAN_AWAL.daftarPasien, '/statistik', '/pesan', '/rawat-inap', '/penunjang', '/farmasi', '/kasir-klaim', '/satusehat', '/test-endpoint', '/pelindungan-data', '/log-audit', '/akses', '/pengaturan-klinik', HALAMAN_AWAL.berandaTugas]);
    for (const h of halamanMenuDiizinkan(pengguna.fitur).filter(x => !tersembunyi.has(x.path))) {
      const a = document.createElement('a'), teks = document.createElement('span'); a.href = h.path; teks.textContent = h.label;
      Object.assign(a.style, { display: 'flex', alignItems: 'center', gap: token.jarak.sm, padding: `${token.jarak.sm} ${token.jarak.md}`, borderRadius: token.radius.sedang, textDecoration: 'none', fontFamily: token.huruf.keluarga, fontSize: token.huruf.ukuran.dasar });
      const icon = buatIkonMenu(h.path); if (icon) a.append(icon); a.append(teks);
      a.addEventListener('click', e => { e.preventDefault(); opsi.pindah(h.path); }); links.push({ a, path: h.path }); el.append(a);
    }
  }
  function perbarui(baru) {
    opsi = baru; if (pengguna !== baru.pengguna) { pengguna = baru.pengguna; bangun(); }
    el.style.display = pengguna ? 'flex' : 'none'; el.className = baru.ringkas ? 'wa-menu-samping' : 'menu-klinik';
    const adaMenuInduk = links.some(l => l.path === baru.aktif);
    for (const { a, path } of links) { const on = path === baru.aktif || (!adaMenuInduk && path === HALAMAN_AWAL.berandaTugas);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
      Object.assign(a.style, { color: on ? token.warna.utamaGelap : token.warna.teksMenu, background: on ? token.warna.utamaLatar : 'transparent', fontWeight: on ? token.huruf.berat.tebal : token.huruf.berat.biasa });
    }
  }
  perbarui(opsi); return { el, perbarui };
}
