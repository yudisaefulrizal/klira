import { FARMASI } from '@klira/shared';
import { token } from '../gaya/token.js';
import { tab } from '../komponen/ui/primitif.js';
import { bacaTabTerakhir, pilihTab, simpanTabTerakhir } from '../util/ingatan-tab.js';
import { navigasiSaatIni } from '../util/navigasi.js';
import { pasangTabMasterObat } from './farmasi/tab-master-obat.js';
import { pasangTabRiwayat } from './farmasi/tab-riwayat.js';

export function HalamanFarmasi() {
  const { search, ganti } = navigasiSaatIni(), daftar = [{ id: 'master', label: FARMASI.tab.master }, { id: 'riwayat', label: FARMASI.tab.riwayat }], ids = daftar.map(t => t.id);
  let aktif, controller;
  const el = document.createElement('div'), header = document.createElement('header'), judul = document.createElement('h1'), isi = document.createElement('div'); el.style.display = isi.style.display = 'contents';
  Object.assign(header.style, { display: 'flex', gap: token.jarak.md, alignItems: 'center', flexWrap: 'wrap' }); judul.textContent = FARMASI.judul; Object.assign(judul.style, { margin: '0', fontSize: token.huruf.ukuran.halaman, fontWeight: token.huruf.berat.tebal, flexGrow: '1' });
  const tabs = tab(daftar, '', FARMASI.tabLabel, id => ganti(`/farmasi?tab=${id}`)); header.append(judul, tabs.el); el.append(header, isi);
  function perbaruiAlamat(alamat) { const dariAlamat = new URLSearchParams(alamat).get('tab'), dipilih = pilihTab(ids, dariAlamat, bacaTabTerakhir('farmasi', ids, sessionStorage)); simpanTabTerakhir('farmasi', dipilih, sessionStorage); tabs.pilih(dipilih); if (aktif !== dipilih) { controller?.tutup(); isi.replaceChildren(); aktif = dipilih; controller = (dipilih === 'master' ? pasangTabMasterObat : pasangTabRiwayat)(isi); } if (dariAlamat !== dipilih) ganti(`/farmasi?tab=${dipilih}`); }
  el.perbaruiAlamat = perbaruiAlamat; el.tutup = () => { controller?.tutup(); el.replaceChildren(); }; perbaruiAlamat(search); return el;
}
