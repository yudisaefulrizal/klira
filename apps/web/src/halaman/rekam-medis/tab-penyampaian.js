import { REKAM_MEDIS, STATUS_PERBAIKAN } from '@klira/shared';
import { daftarPenyampaian } from '../../api-klien/dokumen-rm.js';
import { GalatApi } from '../../api-klien/klien.js';
import { izinSaatIni } from '../../komponen/izin/izin-saja.js';
import { bidang, kartu, tombol, tabel, baris, sel, lencana, peringatan, paginasi } from '../../komponen/ui/primitif.js';
import { token } from '../../gaya/token.js';
import { formatWaktu } from '../../util/tab/penyaring-tab.js';
import { bukaPenyampaianRm } from '../../modal/rekam-medis/penyampaian-rm.js';
export function TabPenyampaian() {
  const P = REKAM_MEDIS.dok.penyampaian, boleh = izinSaatIni(), awal = { cari: '', halaman: 1 }, el = kartu({ style: { padding: '0', overflow: 'hidden' } }), toolbar = document.createElement('form'), status = document.createElement('div'), count = document.createElement('span'), vide = document.createElement('div'), pages = document.createElement('div');
  let draf = { ...awal }, terapan = { ...awal }, actif = true, version = 0, modal;
  Object.assign(toolbar.style, { display: 'flex', gap: token.jarak.md, flexWrap: 'wrap', alignItems: 'flex-end', padding: token.jarak.md }); count.style.color = token.warna.teksRedup;
  const filtre = bidang({ id: 'penyampaian-cari', label: P.cari, jenis: 'search', autoComplete: 'off', ubah(v) { draf.cari = v; } });
  const appliquer = tombol(P.terapkan); appliquer.type = 'submit'; toolbar.append(filtre.el, appliquer, tombol(P.aturUlang, () => { draf = { ...awal }; terapan = { ...awal }; filtre.kontrol.value = draf.cari; void muat(); }, 'sekunder'), count);
  function callbacks() { return { onTutup() { modal = undefined; }, onSelesai() { modal = undefined; void muat(); } }; }
  if (boleh('rekam-medis', 'input')) toolbar.append(tombol(P.catat, () => { modal = bukaPenyampaianRm(callbacks()); }));
  toolbar.addEventListener('submit', e => { e.preventDefault(); terapan = { ...draf, halaman: 1 }; void muat(); });
  const table = tabel(['pasien', 'penerima', 'bentuk', 'bukti', 'petugas', 'waktu'].map(k => ({ judul: P.kolom[k], rataKanan: k === 'tindakan' })), REKAM_MEDIS.dok.tab.penyampaian); el.append(toolbar, status, table.el, vide, pages);
  async function muat() { const saat = ++version; try { const h = await daftarPenyampaian({ cari: terapan.cari, halaman: terapan.halaman, ukuran: 20 }); if (!actif || saat !== version) return; status.replaceChildren();  table.tbody.replaceChildren();
    for (const q of h.data) { const patient = sel(), nom = document.createElement('div'), rm = document.createElement('small'); nom.textContent = q.pasien_nama; nom.style.fontWeight = token.huruf.berat.tebal; rm.textContent = q.pasien_nomor_rm; rm.style.color = token.warna.teksRedup; patient.append(nom, rm);  table.tbody.append(baris(patient, sel(`${q.penerima_nama} (${P.hubunganLabel[q.hubungan]})`), sel(P.bentukLabel[q.bentuk]), sel(q.bukti_persetujuan ?? '-'), sel(q.petugas_nama ?? '-'), sel(formatWaktu(q.waktu)))); }
    vide.hidden = !!h.data.length; vide.textContent = h.data.length ? '' : P.kosong; vide.style.padding = token.jarak.md; pages.replaceChildren(); const p = paginasi(terapan.halaman, h.total, h.ukuran, n => { terapan = { ...terapan, halaman: n }; void muat(); }); if (p) pages.append(p);
  } catch (e) { if (actif && saat === version) status.replaceChildren(peringatan(e instanceof GalatApi ? e.message : REKAM_MEDIS.dok.gagalMuat)); } }
  el.tutup = () => { actif = false; version++; modal?.tutup(); }; void muat(); return el;
}
