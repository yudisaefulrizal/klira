import { AMBANG_BATAS_DEKAT_HARI, aksiKlaimTersedia, KLAIM, STATUS_KLAIM } from '@klira/shared';
import { daftarKlaim } from '../../api-klien/klaim.js';
import { GalatApi } from '../../api-klien/klien.js';
import { izinSaatIni } from '../../komponen/izin/izin-saja.js';
import { bidang, kartu, tombol, tabel, baris, sel, lencana, peringatan, paginasi } from '../../komponen/ui/primitif.js';
import { token } from '../../gaya/token.js';
import { bukaPenyiapanKlaim } from '../../modal/kasir-klaim/penyiapan-klaim.js';
import { bukaUbahStatusKlaim } from '../../modal/kasir-klaim/ubah-status-klaim.js';
import { formatWaktu } from '../../util/tab/penyaring-tab.js';

export function TabKlaim() {
  const boleh = izinSaatIni(), el = kartu({ style: { padding: '0', overflow: 'hidden' } }), toolbar = document.createElement('form'), ringkas = document.createElement('div'), status = document.createElement('div'), kosong = document.createElement('div'), pages = document.createElement('div');
  let draf = { status: '', cari: '', halaman: 1 }, terapan = { ...draf }, aktif = true, versi = 0, modal;
  Object.assign(toolbar.style, { display: 'flex', padding: token.jarak.md, gap: token.jarak.md, flexWrap: 'wrap', alignItems: 'flex-end' }); Object.assign(ringkas.style, { display: 'flex', padding: `0 ${token.jarak.md} ${token.jarak.md}`, gap: token.jarak.sm, flexWrap: 'wrap' });
  const cari = bidang({ id: 'klaim-cari', label: KLAIM.cari, jenis: 'search', autoComplete: 'off', ubah(v) { draf.cari = v; } }), choix = bidang({ id: 'klaim-status', label: KLAIM.filterStatus, opsi: [{ nilai: '', label: KLAIM.semuaStatus }, ...STATUS_KLAIM.nilai.map(s => ({ nilai: s, label: STATUS_KLAIM.label(s) }))], ubah(v) { draf.status = v; } });
  const appliquer = tombol(KLAIM.terapkan); appliquer.type = 'submit'; toolbar.append(cari.el, choix.el, appliquer, tombol(KLAIM.aturUlang, () => { draf = { status: '', cari: '', halaman: 1 }; terapan = { ...draf }; cari.kontrol.value = choix.kontrol.value = ''; void muat(); }, 'sekunder'));
  function ouvre(klaim, statut = false) { const props = { klaim, onTutup() { modal = undefined; }, onSelesai() { modal = undefined; void muat(); } }; modal = statut ? bukaUbahStatusKlaim(props) : bukaPenyiapanKlaim(props); }
  if (boleh('klaim', 'input')) toolbar.append(tombol(KLAIM.siapkan, () => ouvre())); toolbar.addEventListener('submit', e => { e.preventDefault(); terapan = { ...draf, halaman: 1 }; void muat(); });
  const table = tabel(['pasien', 'sep', 'selesai', 'batas', 'status', 'tindakan'].map(k => ({ judul: KLAIM.kolom[k], rataKanan: k === 'tindakan' })), KLAIM.tab); el.append(toolbar, ringkas, status, table.el, kosong, pages);
  async function muat() { const saat = ++versi; try { const h = await daftarKlaim({ status: terapan.status || undefined, cari: terapan.cari, halaman: terapan.halaman, ukuran: 20 }); if (!aktif || saat !== versi) return; status.replaceChildren(); ringkas.replaceChildren(); for (const s of STATUS_KLAIM.nilai.filter(s => h.ringkasan[s] > 0)) ringkas.append(lencana(`${STATUS_KLAIM.label(s)}: ${h.ringkasan[s]}`, STATUS_KLAIM.warna(s))); table.tbody.replaceChildren();
    for (const k of h.data) { const patient = sel(), nom = document.createElement('div'), rm = document.createElement('small'); nom.textContent = k.pasien_nama; nom.style.fontWeight = token.huruf.berat.tebal; rm.textContent = `${k.pasien_nomor_rm}${k.jenis === 'IMP' ? ' · rawat inap' : ''}`; rm.style.color = token.warna.teksRedup; patient.append(nom, rm); const batas = sel(k.sisa_hari === null ? '-' : KLAIM.batas.sisa(k.sisa_hari)); if (k.sisa_hari !== null && k.sisa_hari <= AMBANG_BATAS_DEKAT_HARI) batas.style.color = token.warna.status.merah.teks; const statut = sel(lencana(STATUS_KLAIM.label(k.status), STATUS_KLAIM.warna(k.status))); if (k.kode_beda) statut.append(' ', lencana('Kode beda', 'kuning')); const actions = sel(); actions.style.textAlign = 'right'; if (boleh('klaim', 'perbaikan') && ['menunggu_sep', 'siap_diajukan', 'dikembalikan'].includes(k.status)) actions.append(tombol(KLAIM.berkas, () => ouvre(k), 'teks')); actions.append(tombol(boleh('klaim', 'perbaikan') && aksiKlaimTersedia(k.status).length ? KLAIM.ubahStatus : KLAIM.rincian, () => ouvre(k, true), 'teks')); table.tbody.append(baris(patient, sel(k.nomor_sep ?? '-'), sel(formatWaktu(k.tanggal_selesai)), batas, statut, actions)); }
    kosong.textContent = h.data.length ? '' : KLAIM.kosong; kosong.hidden = !!h.data.length; kosong.style.padding = token.jarak.md; pages.replaceChildren(); const p = paginasi(terapan.halaman, h.total, h.ukuran, n => { terapan = { ...terapan, halaman: n }; void muat(); }); if (p) pages.append(p);
  } catch (e) { if (aktif && saat === versi) status.replaceChildren(peringatan(e instanceof GalatApi ? e.message : KLAIM.gagalMuat)); } }
  el.tutup = () => { aktif = false; versi++; modal?.tutup(); }; void muat(); return el;
}
