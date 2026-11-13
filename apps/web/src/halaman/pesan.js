import { punyaIzin } from '@klira/shared';
import { penggunaSaatIni } from '../util/konteks-pengguna.js';
import { navigasiSaatIni } from '../util/navigasi.js';
import { tab } from '../komponen/ui/primitif.js';
import { HalamanPesanWhatsapp } from './pesan-whatsapp.js';
import { HalamanPesanInstagram } from './pesan-instagram.js';
export function HalamanPesan() {
  const { pengguna } = penggunaSaatIni(), { search, ganti } = navigasiSaatIni(), daftar = [{ id: 'whatsapp', label: 'WhatsApp' }, { id: 'instagram', label: 'Instagram' }].filter(v => pengguna && punyaIzin(pengguna, v.id, 'lihat')), el = document.createElement('div'), panel = document.createElement('div');
  let actif, page; Object.assign(el.style, { display: 'flex', flexDirection: 'column', flex: '1', minHeight: '0' }); Object.assign(panel.style, { display: 'flex', flexDirection: 'column', flex: '1', minHeight: '0' }); panel.setAttribute('role', 'tabpanel'); const tabs = daftar.length ? tab(daftar, '', 'Kanal pesan', id => ganti(`/pesan?kanal=${id}`)) : null; if (tabs) el.append(tabs.el); el.append(panel);
  function perbaruiAlamat(alamat) { const canal = new URLSearchParams(alamat).get('kanal'), next = daftar.find(v => v.id === canal)?.id ?? daftar[0]?.id; if (!next) return; tabs.pilih(next); panel.id = `panel-${next}`; panel.setAttribute('aria-labelledby', `tab-${next}`); if (next !== actif) { page?.tutup(); panel.replaceChildren(); actif = next; page = next === 'instagram' ? HalamanPesanInstagram() : HalamanPesanWhatsapp(); panel.append(page); } }
  el.perbaruiAlamat = perbaruiAlamat; el.tutup = () => { page?.tutup(); el.replaceChildren(); }; perbaruiAlamat(search); return el;
}
