import { AKSI_AUDIT, AUDIT, KEAMANAN, MODAL } from '@klira/shared';
import { daftarAudit, eksporAudit } from '../api-klien/audit.js';
import { GalatApi } from '../api-klien/klien.js';
import { BAWAAN_AUDIT, bacaPenyaring, formatWaktu, penggunaIdSah, queryPenyaring, rentangTerbalik, saringanAudit, saringanEkspor, ubahPenyaring, totalHalaman } from '../util/penyaring-tab.js';
import { unduhTeks } from '../util/unduh.js';
import { teksHtml as aman } from '../util/teks-html.js';
import { bukaLapisanRiwayat } from '../util/riwayat-lapisan.js';
import { bukaDialog } from '../komponen/ui/dialog-dom.js';

const UKURAN = 20;
export function pasangLogAudit(wadah, search, ubahAlamat) {
  let keadaan = bacaPenyaring(search, BAWAAN_AUDIT), draf = { ...keadaan.nilai };
  let hasil = null, galat = null, info = null, mengekspor = false, aktif = true, permintaan = 0, tutupDetail;
  const kolom = [AUDIT.kolom.waktu, AUDIT.kolom.pengguna, AUDIT.kolom.aksi, AUDIT.kolom.entitas, AUDIT.kolom.keterangan, AUDIT.kolom.tindakan];
  const bidang = (nama, label, type = 'text') => `<div class="audit-bidang"><label for="audit-${nama}">${aman(label)}</label><input id="audit-${nama}" name="${nama}" type="${type}"${nama === 'pengguna' ? ' inputmode="numeric"' : ''}><span id="audit-${nama}-galat" class="audit-galat-bidang" role="alert" hidden></span></div>`;
  wadah.innerHTML = `<h1 style="margin:0;font-size:24px;font-weight:600">Log audit</h1><section class="audit-native" id="panel-audit" role="tabpanel" aria-labelledby="tab-audit"><div class="audit-kartu"><div class="audit-judul">${aman(AUDIT.judulTab)}</div><form class="audit-filter">${bidang('pengguna', AUDIT.filterPengguna)}<div class="audit-bidang"><label for="audit-aksi">${aman(AUDIT.filterAksi)}</label><select id="audit-aksi" name="aksi"><option value="">${aman(AUDIT.semuaAksi)}</option>${AKSI_AUDIT.map(a => `<option value="${aman(a)}">${aman(AUDIT.aksi[a] ?? a)}</option>`).join('')}</select></div>${bidang('entitas', AUDIT.filterEntitas)}${bidang('dari', AUDIT.filterDari, 'date')}${bidang('sampai', AUDIT.filterSampai, 'date')}<button class="audit-tombol" type="submit">${aman(AUDIT.terapkan)}</button><button class="audit-tombol audit-sekunder" type="button" data-reset>${aman(AUDIT.aturUlang)}</button><button class="audit-tombol audit-sekunder" type="button" data-ekspor>${aman(AUDIT.ekspor)}</button></form><div data-pesan></div><div class="audit-scroll"><table aria-label="${aman(AUDIT.judulTab)}"><thead><tr>${kolom.map(k => `<th scope="col">${aman(k)}</th>`).join('')}</tr></thead><tbody></tbody></table></div><div data-kosong></div><div data-paginasi></div></div></section>`;
  const cari = selector => wadah.querySelector(selector), form = cari('form');
  function validasi() {
    const pengguna = penggunaIdSah(draf.pengguna) ? '' : AUDIT.penggunaTidakValid;
    const rentang = rentangTerbalik(draf.dari, draf.sampai) ? AUDIT.rentangTerbalik : '';
    for (const [nama, pesan] of [['pengguna', pengguna], ['sampai', rentang]]) {
      const input = form.elements.namedItem(nama), pesanEl = cari(`#audit-${nama}-galat`);
      if (pesan) { input.setAttribute('aria-invalid', 'true'); input.setAttribute('aria-describedby', pesanEl.id); }
      else { input.removeAttribute('aria-invalid'); input.removeAttribute('aria-describedby'); }
      pesanEl.hidden = !pesan; pesanEl.textContent = pesan;
    }
    form.querySelector('[type=submit]').disabled = !!pengguna || !!rentang;
    return !pengguna && !rentang;
  }
  function isiForm() { for (const [k, nilai] of Object.entries(draf)) form.elements.namedItem(k).value = nilai; validasi(); }
  function pesan() {
    cari('[data-pesan]').innerHTML = `${info ? `<div class="audit-pesan audit-info" role="alert">${aman(info)}</div>` : ''}${galat ? `<div class="audit-pesan" role="alert">${aman(galat)}</div>` : ''}`;
    cari('[data-ekspor]').disabled = mengekspor;
    cari('[data-ekspor]').textContent = mengekspor ? AUDIT.mengekspor : AUDIT.ekspor;
  }
  function daftar() {
    cari('tbody').innerHTML = hasil?.data.map(c => `<tr><td>${aman(formatWaktu(c.waktu))}</td><td>${aman(c.pengguna_nama ?? AUDIT.tanpaPengguna)}</td><td>${aman(AUDIT.aksi[c.aksi] ?? c.aksi)}</td><td>${aman(c.entitas_id === null ? c.entitas : `${c.entitas} #${c.entitas_id}`)}</td><td>${aman(c.keterangan)}</td><td><button class="audit-tombol audit-teks" data-detail="${aman(c.id)}">${aman(AUDIT.rincian)}</button></td></tr>`).join('') ?? '';
    cari('[data-kosong]').innerHTML = hasil && !hasil.data.length ? `<div class="audit-kosong">${aman(AUDIT.kosong)}</div>` : '';
    const jumlah = hasil ? totalHalaman(hasil.total, hasil.ukuran) : 1;
    cari('[data-paginasi]').innerHTML = hasil && hasil.total > hasil.ukuran ? `<nav class="audit-paginasi" aria-label="Paginasi"><button class="audit-tombol audit-sekunder" data-halaman="${keadaan.halaman - 1}" ${keadaan.halaman <= 1 ? 'disabled' : ''}>${aman(KEAMANAN.sebelumnya)}</button><span>${keadaan.halaman} / ${jumlah}</span><button class="audit-tombol audit-sekunder" data-halaman="${keadaan.halaman + 1}" ${keadaan.halaman >= jumlah ? 'disabled' : ''}>${aman(KEAMANAN.berikutnya)}</button></nav>` : '';
  }
  async function muat() {
    const versi = ++permintaan;
    try { const baru = await daftarAudit(saringanAudit(keadaan, UKURAN)); if (!aktif || versi !== permintaan) return; hasil = baru; galat = null; daftar(); pesan(); }
    catch (e) { if (aktif && versi === permintaan) { galat = e instanceof GalatApi ? e.message : AUDIT.gagalMuat; pesan(); } }
  }
  const pasang = nilai => ubahAlamat(queryPenyaring('audit', nilai, BAWAAN_AUDIT));
  async function ekspor() {
    if (mengekspor) return;
    mengekspor = true; galat = null; info = null; pesan();
    try { const csv = await eksporAudit(saringanEkspor(keadaan)); if (aktif) { unduhTeks(AUDIT.namaBerkas, csv); info = AUDIT.eksporBerhasil; } }
    catch (e) { if (aktif) galat = e instanceof GalatApi ? e.message : AUDIT.eksporGagal; }
    finally { mengekspor = false; if (aktif) pesan(); }
  }
  function detail(c) {
    tutupDetail?.();
    let lepasRiwayat;
    const tutup = () => { if (!tutupDetail) return; tutupDetail = undefined; lepasRiwayat?.(); dialog.tutup(); };
    const dialog = bukaDialog({ judul: AUDIT.judulDetail, onEsc: tutup, letak: 'kanan', lebar: 'panelSamping' });
    const baris = [[AUDIT.detail.id, c.id], [AUDIT.detail.waktu, formatWaktu(c.waktu)], [AUDIT.detail.pengguna, c.pengguna_nama ?? AUDIT.tanpaPengguna], [AUDIT.detail.aksi, AUDIT.aksi[c.aksi] ?? c.aksi], [AUDIT.detail.entitas, c.entitas], [AUDIT.detail.entitasId, c.entitas_id ?? '-'], [AUDIT.detail.keterangan, c.keterangan ?? '-'], [AUDIT.detail.alamat, c.alamat ?? '-']];
    dialog.isi.innerHTML = `<header style="display:flex;align-items:center;gap:24px;padding:16px 24px;background:var(--warna-kepala-tabel);border-bottom:1px solid var(--warna-garis)"><h2 style="margin:0;font-size:20px;font-weight:600">${aman(AUDIT.judulDetail)}</h2><div style="flex-grow:1;display:flex;align-items:center;gap:24px;min-width:0"></div><button class="audit-tombol audit-sekunder" aria-label="${aman(MODAL.panelTutup)}" title="${aman(MODAL.panelTutup)}" style="padding:0;width:40px"><svg width="16px" height="16px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg></button></header><div style="display:flex;flex-direction:column;gap:16px;padding:24px;overflow-y:auto;flex-grow:1"><section style="display:flex;flex-direction:column;gap:8px"><dl style="margin:0;display:grid;grid-template-columns:max-content 1fr;column-gap:16px;row-gap:8px">${baris.map(([label, nilai]) => `<div style="display:contents"><dt style="color:var(--warna-teks-redup)">${aman(label)}</dt><dd style="margin:0;font-weight:500;overflow-wrap:anywhere">${aman(nilai)}</dd></div>`).join('')}</dl></section></div>`;
    dialog.isi.querySelector('button').addEventListener('click', tutup);
    lepasRiwayat = bukaLapisanRiwayat(window, () => { tutup(); return true; });
    tutupDetail = tutup; dialog.fokus();
  }
  function kirim(e) { e.preventDefault(); if (validasi()) pasang(ubahPenyaring(keadaan, draf)); }
  function input(e) { if (Object.hasOwn(draf, e.target.name)) { draf[e.target.name] = e.target.value; validasi(); } }
  function klik(e) {
    if (!(e.target instanceof Element)) return;
    if (e.target.closest('[data-reset]')) pasang({ nilai: { ...BAWAAN_AUDIT }, halaman: 1 });
    else if (e.target.closest('[data-ekspor]')) void ekspor();
    else if (e.target.closest('[data-halaman]')) pasang({ ...keadaan, halaman: Number(e.target.closest('[data-halaman]').dataset.halaman) });
    else if (e.target.closest('[data-detail]')) { const c = hasil?.data.find(c => String(c.id) === e.target.closest('[data-detail]').dataset.detail); if (c) detail(c); }
  }
  form.addEventListener('input', input); form.addEventListener('change', input); form.addEventListener('submit', kirim); wadah.addEventListener('click', klik);
  isiForm(); void muat();
  return {
    perbaruiAlamat(baru) {
      const sebelumnya = JSON.stringify(keadaan);
      keadaan = bacaPenyaring(baru, BAWAAN_AUDIT); draf = { ...keadaan.nilai }; isiForm();
      if (JSON.stringify(keadaan) !== sebelumnya) { daftar(); void muat(); }
    },
    tutup() {
      aktif = false; permintaan++; tutupDetail?.();
      form.removeEventListener('input', input); form.removeEventListener('change', input); form.removeEventListener('submit', kirim); wadah.removeEventListener('click', klik); wadah.replaceChildren();
    },
  };
}
