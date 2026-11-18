import { token } from '../../gaya/token.js';

/** Kerangka DOM; slot isi dan tombol pesan dapat dipakai konsumen native atau portal React sementara. */
export function pasangTataLetak(wadah, opsi) {
  const el = document.createElement('div'), isi = document.createElement('main'), aksi = document.createElement('div');
  Object.assign(el.style, { display: 'flex', alignItems: 'stretch', gap: '0', background: token.warna.latar });
  el.style.setProperty('--wa-tinggi-tema', token.ukuran.tinggiTema); el.style.setProperty('--wa-lebar-menu', '0px'); el.style.setProperty('--wa-lapis-menu', token.lapis.pesan);
  Object.assign(isi.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md, flex: `999 1 ${token.ukuran.isiMin}`, minWidth: '0', boxSizing: 'border-box' }); aksi.style.display = 'contents';
  el.append(isi, aksi); wadah.replaceChildren(el);
  function perbarui(baru) {
    opsi = baru; const pesan = baru.path === '/pesan'; el.className = pesan ? 'wa-aplikasi' : '';
    Object.assign(el.style, { flexWrap: pesan ? 'nowrap' : 'wrap', minHeight: pesan ? '0' : token.ukuran.tinggiLayar, height: pesan ? `calc(100dvh - ${token.ukuran.tinggiTema})` : '' });
    Object.assign(isi.style, { padding: pesan ? token.jarak.lg : `${token.jarak.lg} ${token.jarak.xl}`, overflow: pesan ? 'hidden' : '' });
  }
  perbarui(opsi); return { isi, aksi, perbarui, tutup() { wadah.replaceChildren(); } };
}
