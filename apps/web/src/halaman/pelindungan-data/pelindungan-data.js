import { PDP, punyaIzin } from '@klira/shared';
import { token } from '../../gaya/token.js';
import { tab } from '../../komponen/ui/primitif.js';
import { bacaTabTerakhir, pilihTab, simpanTabTerakhir } from '../../util/tab/ingatan-tab.js';
import { TABS_PDP } from '../../util/tab/tab-pdp.js';
import { pasangTabPdp } from './kerangka-tab.js';
const HALAMAN = 'pelindungan-data';
const simpanan = () => typeof sessionStorage === 'undefined' ? null : sessionStorage;

export function pasangPelindunganData(wadah, { pengguna, search, ganti, bukaModal, tutupModal }) {
  let aktif, daftar;
  const boleh = !!pengguna && punyaIzin(pengguna, 'pdp', 'lihat');
  const ids = boleh ? TABS_PDP.map(t => t.id) : [];
  const kepala = document.createElement('header'), h1 = document.createElement('h1'), isi = document.createElement('div');
  Object.assign(kepala.style, { display: 'flex', alignItems: 'center', gap: token.jarak.md, flexWrap: 'wrap' });
  h1.textContent = PDP.judul; Object.assign(h1.style, { margin: '0', fontSize: token.huruf.ukuran.halaman, fontWeight: token.huruf.berat.tebal, flexGrow: '1' }); kepala.append(h1); isi.style.display = 'contents';
  const tabs = boleh ? tab(TABS_PDP, '', PDP.tabLabel, id => ganti(`/${HALAMAN}?tab=${id}`)) : null;
  if (tabs) kepala.append(tabs.el); wadah.replaceChildren(kepala, isi);
  function perbaruiAlamat(alamat) {
    const dariAlamat = new URLSearchParams(alamat).get('tab');
    const terpilih = ids.length ? pilihTab(ids, dariAlamat, bacaTabTerakhir(HALAMAN, ids, simpanan())) : undefined;
    if (aktif !== terpilih) {
      daftar?.tutup(); tutupModal?.(); aktif = terpilih;
      if (aktif) daftar = pasangTabPdp(isi, aktif, pengguna, bukaModal); else daftar = undefined;
    }
    if (aktif) {
      tabs.pilih(aktif); simpanTabTerakhir(HALAMAN, aktif, simpanan());
      if (dariAlamat !== aktif) ganti(`/${HALAMAN}?tab=${aktif}`);
    }
  }
  perbaruiAlamat(search);
  return { perbaruiAlamat, muat: () => daftar?.muat(), tutup() { daftar?.tutup(); wadah.replaceChildren(); } };
}
