import { REKAM_MEDIS } from '@klira/shared';
import { tab } from '../../komponen/ui/primitif.js';
import { bacaTabTerakhir, pilihTab, simpanTabTerakhir } from '../../util/tab/ingatan-tab.js';
import { penggunaSaatIni } from '../../util/sesi/konteks-pengguna.js';
import { navigasiSaatIni } from '../../util/navigasi/navigasi.js';
import { tabRekamMedisDiizinkan } from '../../util/tab/tab-rekam-medis.js';
import { TabBerkas } from './tab-berkas.js';
import { TabPembukaan } from './tab-pembukaan.js';
import { TabPenyampaian } from './tab-penyampaian.js';
import { TabPerbaikan } from './tab-perbaikan.js';
import { barisFleks, judulTebal } from '../../gaya/tata-letak.js';
export function HalamanRekamMedis() {
  const { pengguna } = penggunaSaatIni(), { search, ganti } = navigasiSaatIni(), daftar = pengguna ? tabRekamMedisDiizinkan(pengguna) : [], ids = daftar.map(t => t.id), el = document.createElement('div'), header = document.createElement('header'), h = document.createElement('h1'), isi = document.createElement('div'); let aktif, page;
  el.style.display = isi.style.display = 'contents'; barisFleks(header, 'md', { rata: 'center', bungkus: true }); h.textContent = REKAM_MEDIS.judul; judulTebal(h, 'halaman', true); header.append(h); const tabs = daftar.length ? tab(daftar, '', REKAM_MEDIS.tabLabel, id => ganti(`/rekam-medis?tab=${id}`)) : null; if (tabs) header.append(tabs.el); el.append(header, isi);
  function perbaruiAlamat(alamat) { const param = new URLSearchParams(alamat).get('tab'), choisi = ids.length ? pilihTab(ids, param, bacaTabTerakhir('rekam-medis', ids, sessionStorage)) : undefined; if (!choisi) return; simpanTabTerakhir('rekam-medis', choisi, sessionStorage); tabs.pilih(choisi); if (aktif !== choisi) { page?.tutup(); isi.replaceChildren(); aktif = choisi; page = choisi === 'berkas' ? TabBerkas({ laporan: true }) : choisi === 'resume' ? TabBerkas({ judulDaftar: REKAM_MEDIS.dok.tab.resume }) : choisi === 'perbaikan' ? TabPerbaikan() : choisi === 'pembukaan' ? TabPembukaan() : TabPenyampaian(); isi.append(page); } if (param !== choisi) ganti(`/rekam-medis?tab=${choisi}`); }
  el.perbaruiAlamat = perbaruiAlamat; el.tutup = () => { page?.tutup(); el.replaceChildren(); }; perbaruiAlamat(search); return el;
}
