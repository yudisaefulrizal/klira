import { FARMASI } from '@klira/shared';
import { tab, bantuanKecil } from '../../komponen/ui/primitif.js';
import { bacaTabTerakhir, pilihTab, simpanTabTerakhir } from '../../util/tab/ingatan-tab.js';
import { navigasiSaatIni } from '../../util/navigasi/navigasi.js';
import { pasangTabMasterObat } from './tab-master-obat.js';
import { pasangTabRiwayat } from './tab-riwayat.js';
import { barisFleks, judulTebal } from '../../gaya/tata-letak.js';

export function HalamanFarmasi() {
  const { search, ganti } = navigasiSaatIni(), daftar = [{ id: 'master', label: FARMASI.tab.master }, { id: 'riwayat', label: FARMASI.tab.riwayat }], ids = daftar.map(t => t.id);
  let aktif, controller;
  const el = document.createElement('div'), header = document.createElement('header'), judul = document.createElement('h1'), isi = document.createElement('div'); el.style.display = isi.style.display = 'contents';
  barisFleks(header, 'md', { rata: 'center', bungkus: true }); judul.textContent = FARMASI.judul; judulTebal(judul, 'halaman', true);
  const tabs = tab(daftar, '', FARMASI.tabLabel, id => ganti(`/farmasi?tab=${id}`)); header.append(judul, tabs.el, bantuanKecil('Alur Farmasi & Stok', [
    'Resep dokter diproses berurutan: Diajukan -> Ditelaah -> Siap -> Diserahkan.',
    'Pantau lencana stok menipis dan batch hampir kedaluwarsa secara berkala.',
    'Lengkapi kode KFA agar sinkronisasi obat ke SATUSEHAT berjalan akurat.',
  ])); el.append(header, isi);
  function perbaruiAlamat(alamat) { const dariAlamat = new URLSearchParams(alamat).get('tab'), dipilih = pilihTab(ids, dariAlamat, bacaTabTerakhir('farmasi', ids, sessionStorage)); simpanTabTerakhir('farmasi', dipilih, sessionStorage); tabs.pilih(dipilih); if (aktif !== dipilih) { controller?.tutup(); isi.replaceChildren(); aktif = dipilih; controller = (dipilih === 'master' ? pasangTabMasterObat : pasangTabRiwayat)(isi); } if (dariAlamat !== dipilih) ganti(`/farmasi?tab=${dipilih}`); }
  el.perbaruiAlamat = perbaruiAlamat; el.tutup = () => { controller?.tutup(); el.replaceChildren(); }; perbaruiAlamat(search); return el;
}
