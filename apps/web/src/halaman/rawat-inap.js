import { KELAS_RAWAT, RAWAT_INAP, STATUS_BED } from '@klira/shared';
import { KelolaMasterTab } from '../komponen/kelola-master-tab.js';
import { tab, kartu, tombol, lencana, peringatan } from '../komponen/ui/primitif.js';
import { bacaTabTerakhir, pilihTab, simpanTabTerakhir } from '../util/ingatan-tab.js';
import { navigasiSaatIni } from '../util/navigasi.js';
import { ambilPapan } from '../api-klien/rawat-inap.js';
import { GalatApi } from '../api-klien/klien.js';
import { izinSaatIni } from '../komponen/izin-saja.js';
import { token } from '../gaya/token.js';
import { bukaAdmisiRawatInap } from '../modal/pelayanan-klinik/admisi-rawat-inap.js';
import { bukaCatatanHarian } from '../modal/pelayanan-klinik/catatan-harian.js';
import { bukaPemulanganRawatInap } from '../modal/pelayanan-klinik/pemulangan-rawat-inap.js';
import { bukaUbahPenempatan } from '../modal/pelayanan-klinik/ubah-penempatan.js';
import { formatWaktu } from '../util/penyaring-tab.js';

function PapanBed() {
  const P = RAWAT_INAP.papan, boleh = izinSaatIni(), { ganti } = navigasiSaatIni(), el = document.createElement('div'), toolbar = document.createElement('div'), ringkas = document.createElement('span'), status = document.createElement('div'), isi = document.createElement('div');
  let aktif = true, versi = 0, modal;
  for (const node of [el, isi]) Object.assign(node.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md });
  Object.assign(toolbar.style, { display: 'flex', gap: token.jarak.md, justifyContent: 'flex-end', flexWrap: 'wrap', alignItems: 'center' }); ringkas.style.color = token.warna.teksRedup; toolbar.append(ringkas); el.append(toolbar, status, isi);
  function fermer() { modal = undefined; }
  function termine() { modal = undefined; void muat(); }
  function ouvre(jenis, pasien) { const props = { kunjunganId: pasien?.kunjungan_id, pasien, onTutup: fermer, onSelesai: termine }; if (jenis === 'admisi') modal = bukaAdmisiRawatInap(props); else if (jenis === 'cppt') modal = bukaCatatanHarian({ ...props, onTutup: termine }); else if (jenis === 'penempatan') modal = bukaUbahPenempatan(props); else modal = bukaPemulanganRawatInap(props); }
  if (boleh('klinis', 'input')) toolbar.append(tombol(P.admisi, () => ouvre('admisi')));
  function petit(teks) { const node = document.createElement('span'); node.textContent = teks; Object.assign(node.style, { color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }); return node; }
  function ligne() { const node = document.createElement('div'); Object.assign(node.style, { display: 'flex', gap: token.jarak.sm, flexWrap: 'wrap', alignItems: 'center' }); return node; }
  function actions(pasien, attente = false) { const row = ligne(); if (!attente && boleh('klinis', 'lihat')) row.append(tombol(P.cppt, () => ouvre('cppt', pasien), 'teks')); if (boleh('klinis', 'input')) row.append(tombol(attente ? P.tempatkan : P.penempatan, () => ouvre('penempatan', pasien), 'teks'), tombol(P.pemulangan, () => ouvre('pulang', pasien), 'teks')); return row; }
  async function muat() {
    const saat = ++versi;
    try { const papan = await ambilPapan(); if (!aktif || saat !== versi) return; status.replaceChildren(); isi.replaceChildren(); ringkas.textContent = P.ringkasan(papan.ringkasan.total, papan.ringkasan.terisi, papan.ringkasan.kosong);
      if (papan.menunggu.length) { const box = kartu({ susun: 'sm' }), title = document.createElement('strong'); box.setAttribute('aria-label', P.menunggu); title.textContent = P.menunggu; box.append(title); for (const m of papan.menunggu) { const row = ligne(), nom = document.createElement('span'), strong = document.createElement('strong'); nom.style.flexGrow = '1'; strong.textContent = m.pasien_nama; nom.append(strong, ' ', petit(`${m.pasien_nomor_rm}${m.dpjp_nama ? ` · ${P.dpjp(m.dpjp_nama)}` : ''} · ${P.sejak(formatWaktu(m.mulai))}`)); row.append(nom, actions({ kunjungan_id: m.kunjungan_id, nama: m.pasien_nama, nomor_rm: m.pasien_nomor_rm }, true)); box.append(row); } isi.append(box); }
      if (!papan.bed.length) { const message = peringatan(P.kosong, 'biru'); if (boleh('master', 'lihat')) message.append(tombol(P.tambahRuang, () => ganti('/rawat-inap?tab=ruang'), 'teks')); isi.append(message); }
      const groupes = new Map(); for (const bed of papan.bed) { const ruang = bed.ruang_nama ?? P.ruangTanpa; if (!groupes.has(ruang)) groupes.set(ruang, []); groupes.get(ruang).push(bed); }
      for (const [ruang, beds] of groupes) { const section = document.createElement('section'), title = document.createElement('h2'), grid = document.createElement('div'); title.textContent = ruang; Object.assign(title.style, { margin: `0 0 ${token.jarak.sm}`, fontSize: token.huruf.ukuran.besar }); Object.assign(grid.style, { display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${token.ukuran.kartuBed}, 1fr))`, gap: token.jarak.md }); for (const b of beds) { const box = kartu({ susun: 'xs' }), row = ligne(), nom = document.createElement('strong'); box.setAttribute('aria-label', `${P.bedLabel} ${b.nama}`); nom.textContent = b.nama; nom.style.flexGrow = '1'; row.append(nom, lencana(STATUS_BED.label(b.status), STATUS_BED.warna(b.status))); box.append(row); if (b.penghuni) { const p = b.penghuni, label = document.createElement('span'), strong = document.createElement('strong'); strong.textContent = p.pasien_nama; label.append(strong, ' ', petit(p.pasien_nomor_rm)); box.append(label, petit(`${KELAS_RAWAT.label(p.kelas)}${p.dpjp_nama ? ` · ${P.dpjp(p.dpjp_nama)}` : ''} · ${P.sejak(formatWaktu(p.mulai))}`), actions({ kunjungan_id: p.kunjungan_id, nama: p.pasien_nama, nomor_rm: p.pasien_nomor_rm })); } else box.append(petit(P.kosongBed)); grid.append(box); } section.append(title, grid); isi.append(section); }
    } catch (e) { if (aktif && saat === versi) status.replaceChildren(peringatan(e instanceof GalatApi ? e.message : RAWAT_INAP.gagalMuat)); }
  }
  void muat(); el.tutup = () => { aktif = false; versi++; modal?.tutup(); }; return el;
}

export function HalamanRawatInap() {
  const boleh = izinSaatIni(), { search, ganti } = navigasiSaatIni(), daftar = [...(boleh('klinis', 'lihat') ? [{ id: 'papan', label: RAWAT_INAP.tab.papan }] : []), ...(boleh('master', 'lihat') ? [{ id: 'ruang', label: RAWAT_INAP.tab.ruang }, { id: 'bed', label: RAWAT_INAP.tab.bed }] : [])], ids = daftar.map(t => t.id);
  const el = document.createElement('div'), header = document.createElement('header'), title = document.createElement('h1'), isi = document.createElement('div'); el.style.display = isi.style.display = 'contents'; Object.assign(header.style, { display: 'flex', alignItems: 'center', gap: token.jarak.md, flexWrap: 'wrap' }); title.textContent = RAWAT_INAP.judul; Object.assign(title.style, { margin: '0', flexGrow: '1', fontSize: token.huruf.ukuran.halaman, fontWeight: token.huruf.berat.tebal }); header.append(title);
  const tabs = daftar.length > 1 ? tab(daftar, '', RAWAT_INAP.judul, id => ganti(`/rawat-inap?tab=${id}`)) : null; if (tabs) header.append(tabs.el); el.append(header, isi); let courant, page;
  function perbaruiAlamat(alamat) { const choisi = ids.length ? pilihTab(ids, new URLSearchParams(alamat).get('tab'), bacaTabTerakhir('rawat-inap', ids, sessionStorage)) : undefined; if (!choisi) return; simpanTabTerakhir('rawat-inap', choisi, sessionStorage); tabs?.pilih(choisi); if (courant === choisi) { page?.perbaruiAlamat?.(alamat); return; } page?.tutup(); isi.replaceChildren(); courant = choisi; page = choisi === 'papan' ? PapanBed() : KelolaMasterTab({ jenis: choisi }); isi.append(page); if (choisi !== 'papan') page.perbaruiAlamat(alamat); }
  el.perbaruiAlamat = perbaruiAlamat; el.tutup = () => { page?.tutup(); el.replaceChildren(); }; perbaruiAlamat(search); return el;
}
