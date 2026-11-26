import { PENGATURAN_SATUSEHAT as S } from '@klira/shared';
import { pesanGalat } from '../../api-klien/klien.js';
import { ambilKonfigurasiSatusehat, ujiSatusehat } from '../../api-klien/satusehat.js';
import { izinSaatIni } from '../../komponen/izin/izin-saja.js';
import { PanelPantauIntegrasi } from '../../komponen/klinis/panel-pantau-integrasi.js';
import { kartu, peringatan, tombol } from '../../komponen/ui/primitif.js';
import { token } from '../../gaya/token.js';
import { formatWaktu } from '../../util/tab/penyaring-tab.js';
import { barisKoneksi, ujiBerhasil } from './keadaan-satusehat.js';
import { barisFleks, teksRedupKecil } from '../../gaya/tata-letak.js';

const H = S.halaman;
const kolom = (gap) => ({ display: 'flex', flexDirection: 'column', gap });

/** Kartu koneksi: isi .env (hanya baca), tombol uji, dan hasil uji terakhir. */
function kartuKoneksi({ bolehUbah }) {
  let k = null, memproses = false, galat = null;
  const el = kartu({ susun: 'md' }), judul = document.createElement('h2'), pesan = document.createElement('div'), daftar = document.createElement('dl'), hasil = document.createElement('div'), tombolBaris = document.createElement('div');
  judul.textContent = H.koneksi; Object.assign(judul.style, { margin: 0, fontSize: token.huruf.ukuran.dasar, fontWeight: token.huruf.berat.tebal });
  Object.assign(pesan.style, kolom(token.jarak.sm)); teksRedupKecil(hasil); barisFleks(tombolBaris, 'sm', { bungkus: true });
  Object.assign(daftar.style, { display: 'grid', gridTemplateColumns: 'max-content minmax(0, 1fr)', gap: `${token.jarak.sm} ${token.jarak.lg}`, margin: 0 });
  const uji = tombol(H.uji, null, 'sekunder'); tombolBaris.append(uji); el.append(judul, pesan, daftar, tombolBaris, hasil);

  function tampil() {
    pesan.replaceChildren();
    if (galat) pesan.append(peringatan(galat));
    if (k?.masalah) pesan.append(peringatan(k.masalah, 'kuning'));
    daftar.replaceChildren(...(k ? barisKoneksi(k) : []).flatMap(([label, nilai]) => {
      const dt = document.createElement('dt'), dd = document.createElement('dd'); dt.textContent = label; dt.style.color = token.warna.teksRedup;
      dd.textContent = nilai; Object.assign(dd.style, { margin: 0, overflowWrap: 'anywhere' }); return [dt, dd];
    }));
    uji.hidden = !bolehUbah || !k?.aktif; uji.disabled = memproses;
    hasil.style.color = k?.hasil_uji ? (ujiBerhasil(k.hasil_uji) ? token.warna.status.hijau.teks : token.warna.status.merah.teks) : token.warna.teksRedup;
    hasil.textContent = k?.hasil_uji ? `${k.hasil_uji} ${H.terakhirUji(formatWaktu(k.diuji_pada))}` : H.belumDiuji;
  }
  uji.addEventListener('click', async () => {
    memproses = true; galat = null; tampil();
    try { k = (await ujiSatusehat()).konfigurasi; }
    catch (e) { galat = pesanGalat(e, H.gagalUji); }
    finally { memproses = false; tampil(); }
  });
  tampil();
  return { el, terapkan(dto) { k = dto; tampil(); } };
}

export function HalamanSatusehat() {
  const bolehUbah = izinSaatIni()('satusehat', 'perbaikan');
  let hidup = true;
  const el = document.createElement('div'), header = document.createElement('header'), h1 = document.createElement('h1'), petunjuk = document.createElement('p'), banner = document.createElement('div');
  el.style.display = 'contents'; Object.assign(header.style, kolom(token.jarak.sm)); Object.assign(h1.style, { margin: 0, fontSize: token.huruf.ukuran.halaman, fontWeight: token.huruf.berat.tebal });
  h1.textContent = H.judul; Object.assign(petunjuk.style, { margin: 0, color: token.warna.teksRedup }); petunjuk.textContent = H.petunjuk;
  Object.assign(banner.style, kolom(token.jarak.sm));
  header.append(h1, petunjuk); el.append(header, banner);
  const koneksi = kartuKoneksi({ bolehUbah }); koneksi.el.style.maxWidth = '640px'; el.append(koneksi.el);
  async function muat() {
    try {
      const d = await ambilKonfigurasiSatusehat(); if (!hidup) return;
      banner.replaceChildren(peringatan(H.sumber, 'biru'));
      if (!bolehUbah) banner.append(peringatan(H.bacaSaja, 'biru'));
      koneksi.terapkan(d);
    } catch (e) { if (hidup) banner.replaceChildren(peringatan(pesanGalat(e, H.gagalMuat))); }
  }

  const pantauBox = PanelPantauIntegrasi({ bolehKirim: bolehUbah });
  pantauBox.style.marginTop = token.jarak.lg;
  el.append(pantauBox);

  void muat();
  el.tutup = () => { hidup = false; pantauBox.tutup?.(); el.replaceChildren(); };
  return el;
}
