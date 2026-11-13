import { INTERPRETASI_HASIL, NILAI_STATUS_ORDER, PENUNJANG, PRIORITAS_ORDER, STATUS_ORDER_PENUNJANG } from '@klira/shared';
import { GalatApi } from '../../api-klien/klien.js';
import { rekapLab } from '../../api-klien/penunjang.js';
import { bidang, kartu, tombol, tabel, baris, sel, lencana, peringatan, paginasi } from '../../komponen/ui/primitif.js';
import { token } from '../../gaya/token.js';
import { navigasiSaatIni } from '../../util/navigasi/navigasi.js';
import { formatWaktu } from '../../util/tab/penyaring-tab.js';

export function pasangTabRekap(wadah) {
  const R = PENUNJANG.rekap, { ganti } = navigasiSaatIni(), awal = { status: '', dari: '', sampai: '', halaman: 1 };
  let draf = { ...awal }, terapan = { ...awal }, aktif = true, urut = 0;
  const el = document.createElement('div'), box = kartu({ style: { padding: '0', overflow: 'hidden' } }), toolbar = document.createElement('form'), status = document.createElement('div'), kosong = document.createElement('div'), pages = document.createElement('div');
  Object.assign(el.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md }); Object.assign(toolbar.style, { display: 'flex', gap: token.jarak.md, padding: token.jarak.md, flexWrap: 'wrap', alignItems: 'flex-end' });
  const fStatus = bidang({ id: 'rekap-status', label: R.filterStatus, opsi: [{ nilai: '', label: R.semuaStatus }, ...NILAI_STATUS_ORDER.map(s => ({ nilai: s, label: STATUS_ORDER_PENUNJANG.label(s) }))], ubah(v) { draf.status = v; } });
  const dari = bidang({ id: 'rekap-dari', label: R.dari, jenis: 'date', ubah(v) { draf.dari = v; periode(); } }), sampai = bidang({ id: 'rekap-sampai', label: R.sampai, jenis: 'date', ubah(v) { draf.sampai = v; periode(); } });
  const terapkan = tombol('Terapkan'); terapkan.type = 'submit';
  function periode() { const terbalik = !!draf.dari && !!draf.sampai && draf.dari > draf.sampai; sampai.setGalat(terbalik ? 'Tanggal akhir sebelum tanggal awal.' : undefined); terapkan.disabled = terbalik; }
  toolbar.append(fStatus.el, dari.el, sampai.el, terapkan, tombol('Atur ulang', () => { draf = { ...awal }; terapan = { ...awal }; fStatus.kontrol.value = dari.kontrol.value = sampai.kontrol.value = ''; periode(); void muat(); }, 'sekunder'));
  toolbar.addEventListener('submit', e => { e.preventDefault(); if (!terapkan.disabled) { terapan = { ...draf, halaman: 1 }; void muat(); } });
  const table = tabel(['pasien', 'pemeriksaan', 'prioritas', 'status', 'hasil', 'waktu'].map(k => ({ judul: R.kolom[k] })), PENUNJANG.tab.rekap);
  Object.assign(kosong.style, { padding: token.jarak.md, color: token.warna.teksRedup }); box.append(toolbar, status, table.el, kosong, pages);
  const catatan = document.createElement('p'), tautan = document.createElement('a'); Object.assign(catatan.style, { margin: '0', color: token.warna.teksRedup }); tautan.href = '/pasien'; tautan.textContent = R.bukaDaftar; tautan.addEventListener('click', e => { e.preventDefault(); ganti('/pasien'); }); catatan.append(R.catatan, ' ', tautan); el.append(box, catatan); wadah.append(el);
  async function muat() { const id = ++urut; try { const h = await rekapLab({ status: terapan.status || undefined, dari: terapan.dari || undefined, sampai: terapan.sampai || undefined, halaman: terapan.halaman, ukuran: 20 }); if (!aktif || id !== urut) return; status.replaceChildren(); table.tbody.replaceChildren(); for (const o of h.data) { const pasien = sel(), nom = document.createElement('div'), rm = document.createElement('div'); nom.textContent = o.pasien_nama; nom.style.fontWeight = token.huruf.berat.tebal; rm.textContent = o.pasien_nomor_rm; Object.assign(rm.style, { color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }); pasien.append(nom, rm); const hasil = sel(o.hasil_singkat ?? '-'); if (o.interpretasi) hasil.append(' ', lencana(INTERPRETASI_HASIL.label(o.interpretasi), INTERPRETASI_HASIL.warna(o.interpretasi))); table.tbody.append(baris(pasien, sel(o.nama), sel(lencana(PRIORITAS_ORDER.label(o.prioritas), PRIORITAS_ORDER.warna(o.prioritas))), sel(lencana(STATUS_ORDER_PENUNJANG.label(o.status), STATUS_ORDER_PENUNJANG.warna(o.status))), hasil, sel(formatWaktu(o.dibuat_pada)))); } kosong.hidden = !!h.data.length; kosong.textContent = h.data.length ? '' : R.kosong; pages.replaceChildren(); const p = paginasi(terapan.halaman, h.total, h.ukuran, n => { terapan = { ...terapan, halaman: n }; void muat(); }); if (p) pages.append(p); } catch (e) { if (aktif && id === urut) status.replaceChildren(peringatan(e instanceof GalatApi ? e.message : R.gagalMuat)); } }
  void muat(); return { tutup() { aktif = false; urut++; el.remove(); } };
}
