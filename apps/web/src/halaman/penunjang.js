import { PENUNJANG } from '@klira/shared';
import { token } from '../gaya/token.js';
import { tab } from '../komponen/ui/primitif.js';
import { bacaTabTerakhir, pilihTab, simpanTabTerakhir } from '../util/tab/ingatan-tab.js';
import { navigasiSaatIni } from '../util/navigasi/navigasi.js';
import { pasangTabMasterPemeriksaan } from './penunjang/tab-master-pemeriksaan.js';
import { pasangTabRekap } from './penunjang/tab-rekap.js';

export function HalamanPenunjang() {
  const { search, ganti } = navigasiSaatIni(), daftar = [{ id: 'rekap', label: PENUNJANG.tab.rekap }, { id: 'master', label: PENUNJANG.tab.master }], ids = daftar.map(t => t.id);
  let aktif, controller;
  const el = document.createElement('div'), header = document.createElement('header'), judul = document.createElement('h1'), isi = document.createElement('div'); el.style.display = isi.style.display = 'contents';
  Object.assign(header.style, { display: 'flex', gap: token.jarak.md, alignItems: 'center', flexWrap: 'wrap' }); judul.textContent = PENUNJANG.judul; Object.assign(judul.style, { margin: '0', fontSize: token.huruf.ukuran.halaman, fontWeight: token.huruf.berat.tebal, flexGrow: '1' });
  const tabs = tab(daftar, '', PENUNJANG.tabLabel, id => ganti(`/penunjang?tab=${id}`)); header.append(judul, tabs.el); el.append(header, isi);
  function perbaruiAlamat(alamat) { const dariAlamat = new URLSearchParams(alamat).get('tab'), dipilih = pilihTab(ids, dariAlamat, bacaTabTerakhir('penunjang', ids, sessionStorage)); simpanTabTerakhir('penunjang', dipilih, sessionStorage); tabs.pilih(dipilih); if (aktif !== dipilih) { controller?.tutup(); isi.replaceChildren(); aktif = dipilih; controller = (dipilih === 'master' ? pasangTabMasterPemeriksaan : pasangTabRekap)(isi); } if (dariAlamat !== dipilih) ganti(`/penunjang?tab=${dipilih}`); }
  el.perbaruiAlamat = perbaruiAlamat; el.tutup = () => { controller?.tutup(); el.replaceChildren(); }; perbaruiAlamat(search); return el;
}
