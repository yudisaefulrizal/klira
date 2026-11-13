import { HALAMAN_AWAL, MASUK, NAVIGASI, halamanMenuDiizinkan } from '@klira/shared';
import { token } from '../gaya/token.js';
import { tombol } from './ui/native.js';
import { buatIkonMenu } from './ikon-menu.js';

export function buatMenuSamping(opsi) {
  let pengguna, links = [];
  const el = document.createElement('nav'); el.setAttribute('aria-label', NAVIGASI.menuUtama);
  Object.assign(el.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.xs, borderRight: `${token.ukuran.garis} solid ${token.warna.garis}`, flex: `0 0 ${token.ukuran.menuSamping}`, boxSizing: 'border-box', padding: `${token.jarak.lg} ${token.jarak.md}`, background: token.warna.permukaan });
  function bangun() {
    el.replaceChildren(); links = []; if (!pengguna) return;
    const merek = document.createElement('div'); Object.assign(merek.style, { display: 'flex', alignItems: 'center', gap: token.jarak.sm, padding: `${token.jarak.xs} ${token.jarak.md} ${token.jarak.lg}` });
    merek.innerHTML = '<span class="logo-klira logo-klira-asli"><img src="/asset/brand/klira.png" alt="Klira" width="2172" height="724"></span>'; el.append(merek);
    for (const h of halamanMenuDiizinkan(pengguna.fitur)) {
      const a = document.createElement('a'), teks = document.createElement('span'); a.href = h.path; teks.textContent = h.label;
      Object.assign(a.style, { display: 'flex', alignItems: 'center', gap: token.jarak.sm, padding: `${token.jarak.sm} ${token.jarak.md}`, borderRadius: token.radius.sedang, textDecoration: 'none', fontFamily: token.huruf.keluarga, fontSize: token.huruf.ukuran.dasar });
      const icon = buatIkonMenu(h.path); if (icon) a.append(icon); a.append(teks);
      a.addEventListener('click', e => { e.preventDefault(); opsi.pindah(h.path); }); links.push({ a, path: h.path }); el.append(a);
    }
    const ruang = document.createElement('div'); Object.assign(ruang.style, { flexGrow: '1', minHeight: token.jarak.xl }); el.append(ruang);
    const akun = document.createElement('div'), nama = document.createElement('div'), jenis = document.createElement('div');
    Object.assign(akun.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.xs, padding: token.jarak.md, borderTop: `${token.ukuran.garis} solid ${token.warna.garis}` });
    nama.textContent = pengguna.nama; Object.assign(nama.style, { fontWeight: token.huruf.berat.tebal, fontSize: token.huruf.ukuran.dasar });
    jenis.title = pengguna.jenis_akun.join(', '); jenis.append(`${pengguna.jenis_akun[0] ?? ''}${pengguna.jenis_akun.length > 1 ? ` · +${pengguna.jenis_akun.length - 1} lainnya` : ''}`);
    Object.assign(jenis.style, { color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil });
    if (pengguna.jenis_akun.length > 1) { const detail = document.createElement('details'), summary = document.createElement('summary'), p = document.createElement('p'); detail.className = 'menu-peran'; summary.textContent = 'Lihat semua peran'; p.textContent = pengguna.jenis_akun.join(', '); detail.append(summary, p); jenis.append(detail); }
    const keluar = tombol(MASUK.keluar, () => void opsi.keluar(), 'sekunder'); keluar.style.marginTop = token.jarak.sm; akun.append(nama, jenis, keluar); el.append(akun);
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
