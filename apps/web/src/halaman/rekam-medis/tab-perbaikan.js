import { REKAM_MEDIS, STATUS_PERBAIKAN } from '@klira/shared';
import { daftarPerbaikan } from '../../api-klien/rekam-medis.js';
import { GalatApi } from '../../api-klien/klien.js';
import { izinSaatIni } from '../../komponen/izin/izin-saja.js';
import { bidang, kartu, tombol, tabel, baris, sel, lencana, peringatan, paginasi } from '../../komponen/ui/primitif.js';
import { token } from '../../gaya/token.js';
import { formatWaktu } from '../../util/tab/penyaring-tab.js';
import { bukaTinjauPerbaikan } from '../../modal/rekam-medis/tinjau-perbaikan.js';
export function TabPerbaikan() {
  const P = REKAM_MEDIS.tinjau, boleh = izinSaatIni(), awal = { status: 'diajukan', halaman: 1 }, el = kartu({ style: { padding: '0', overflow: 'hidden' } }), toolbar = document.createElement('form'), status = document.createElement('div'), count = document.createElement('span'), vide = document.createElement('div'), pages = document.createElement('div');
  let draf = { ...awal }, terapan = { ...awal }, actif = true, version = 0, modal;
  Object.assign(toolbar.style, { display: 'flex', gap: token.jarak.md, flexWrap: 'wrap', alignItems: 'flex-end', padding: token.jarak.md }); count.style.color = token.warna.teksRedup;
  const filtre = bidang({ id: 'rm-status', label: P.filter ?? P.filterStatus, nilai: draf.status, opsi: [{ nilai: '', label: P.semua }, ...['diajukan', 'disetujui', 'ditolak'].map(s => ({ nilai: s, label: STATUS_PERBAIKAN.label(s) }))], ubah(v) { draf.status = v; } });
  const appliquer = tombol('Terapkan'); appliquer.type = 'submit'; toolbar.append(filtre.el, appliquer, tombol('Atur ulang', () => { draf = { ...awal }; terapan = { ...awal }; filtre.kontrol.value = draf.status; void muat(); }, 'sekunder'), count);
  function callbacks() { return { onTutup() { modal = undefined; }, onSelesai() { modal = undefined; void muat(); } }; }
  
  toolbar.addEventListener('submit', e => { e.preventDefault(); terapan = { ...draf, halaman: 1 }; void muat(); });
  const table = tabel(['pasien', 'bagian', 'pemohon', 'alasan', 'status', 'waktu', 'tindakan'].map(k => ({ judul: P.kolom[k], rataKanan: k === 'tindakan' })), REKAM_MEDIS.tab.perbaikan); el.append(toolbar, status, table.el, vide, pages);
  async function muat() { const saat = ++version; try { const h = await daftarPerbaikan({ status: terapan.status || undefined, halaman: terapan.halaman, ukuran: 20 }); if (!actif || saat !== version) return; status.replaceChildren(); count.textContent = P.menunggu(h.menunggu); table.tbody.replaceChildren();
    for (const q of h.data) { const patient = sel(), nom = document.createElement('div'), rm = document.createElement('small'); nom.textContent = q.pasien_nama; nom.style.fontWeight = token.huruf.berat.tebal; rm.textContent = q.pasien_nomor_rm; rm.style.color = token.warna.teksRedup; patient.append(nom, rm); const actions = sel(); actions.style.textAlign = 'right'; if (q.status !== 'diajukan' || boleh('rekam-medis', 'perbaikan')) actions.append(tombol(P.tinjau, () => { const props = callbacks(); modal = bukaTinjauPerbaikan({ ...props, permintaan: q }); }, 'teks')); table.tbody.append(baris(patient, sel(REKAM_MEDIS.perbaikan.bagianLabel[q.bagian]), sel(q.pemohon_nama ?? '-'), sel(q.alasan), sel(lencana(STATUS_PERBAIKAN.label(q.status), STATUS_PERBAIKAN.warna(q.status))), sel(formatWaktu(q.dibuat_pada)), actions)); }
    vide.hidden = !!h.data.length; vide.textContent = h.data.length ? '' : P.kosong; vide.style.padding = token.jarak.md; pages.replaceChildren(); const p = paginasi(terapan.halaman, h.total, h.ukuran, n => { terapan = { ...terapan, halaman: n }; void muat(); }); if (p) pages.append(p);
  } catch (e) { if (actif && saat === version) status.replaceChildren(peringatan(e instanceof GalatApi ? e.message : P.gagalMuat)); } }
  el.tutup = () => { actif = false; version++; modal?.tutup(); }; void muat(); return el;
}
