import { token } from '../gaya/token.js';
import { tombol } from './ui/primitif.js';
import { buatMenuSamping } from './menu-samping.js';

/** Kerangka DOM; slot isi dan tombol pesan dapat dipakai konsumen native atau portal React sementara. */
export function pasangTataLetak(wadah, opsi) {
  let menu = false, mobile;
  const el = document.createElement('div'), isi = document.createElement('main'), aksi = document.createElement('div');
  Object.assign(el.style, { display: 'flex', alignItems: 'stretch', gap: '0', background: token.warna.latar });
  el.style.setProperty('--wa-tinggi-tema', token.ukuran.tinggiTema); el.style.setProperty('--wa-lebar-menu', token.ukuran.menuSamping); el.style.setProperty('--wa-lapis-menu', token.lapis.pesan);
  Object.assign(isi.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md, flex: `999 1 ${token.ukuran.isiMin}`, minWidth: '0', boxSizing: 'border-box' }); aksi.style.display = 'contents';
  function pindah(ke) { menu = false; perbaruiMenu(); opsi.pindah(ke); }
  const navigasi = buatMenuSamping({ pengguna: opsi.pengguna, aktif: opsi.path, ringkas: opsi.path === '/pesan', pindah, keluar: opsi.keluar });
  el.append(navigasi.el, isi, aksi); wadah.replaceChildren(el);
  function perbaruiMenu() {
    el.dataset.menu = String(menu);
    if (!mobile) return;
    const button = mobile.querySelector('button'); button.setAttribute('aria-expanded', String(menu));
    button.innerHTML = `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" style="width:${token.ukuran.ikonPesan};height:${token.ukuran.ikonPesan};flex-shrink:0"><path d="${menu ? 'm6 6 12 12M6 18 18 6' : 'M4 6h16M4 12h16M4 18h16'}"/></svg>${menu ? 'Tutup' : 'Menu'}`;
  }
  function perbarui(baru) {
    opsi = baru; const pesan = baru.path === '/pesan'; el.className = pesan ? 'wa-aplikasi' : '';
    Object.assign(el.style, { flexWrap: pesan ? 'nowrap' : 'wrap', minHeight: pesan ? '0' : token.ukuran.tinggiLayar, height: pesan ? `calc(100dvh - ${token.ukuran.tinggiTema})` : '' });
    Object.assign(isi.style, { padding: pesan ? token.jarak.lg : `${token.jarak.lg} ${token.jarak.xl}`, overflow: pesan ? 'hidden' : '' });
    navigasi.perbarui({ pengguna: baru.pengguna, aktif: baru.path, ringkas: pesan, pindah, keluar: baru.keluar });
    if (pesan && !mobile) { mobile = document.createElement('div'); mobile.className = 'wa-menu-mobile'; const button = tombol('', () => { menu = !menu; perbaruiMenu(); }, 'teks'); button.classList.add('wa-menu-buka'); button.setAttribute('aria-label', 'Menu utama'); mobile.append(button); isi.prepend(mobile); }
    else if (!pesan && mobile) { mobile.remove(); mobile = undefined; }
    perbaruiMenu();
  }
  perbarui(opsi); return { isi, aksi, perbarui, tutup() { wadah.replaceChildren(); } };
}
