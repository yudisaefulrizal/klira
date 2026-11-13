import { FARMASI, STATUS_RESEP } from '@klira/shared';
import { riwayatObat } from '../../api-klien/farmasi.js';
import { GalatApi } from '../../api-klien/klien.js';
import { izinSaatIni } from '../../komponen/izin/izin-saja.js';
import { bidang, kartu, tombol, tabel, baris, sel, lencana, peringatan, paginasi } from '../../komponen/ui/primitif.js';
import { bukaSerahTerimaObat } from '../../modal/farmasi/serah-terima-obat.js';
import { token } from '../../gaya/token.js';
import { formatWaktu } from '../../util/tab/penyaring-tab.js';

export function pasangTabRiwayat(wadah) {
  const R = FARMASI.riwayat, boleh = izinSaatIni(), awal = { status: '', dari: '', sampai: '', halaman: 1 };
  let draf = { ...awal }, terapan = { ...awal }, aktif = true, urut = 0, modal;
  const el = document.createElement('div'), box = kartu({ style: { padding: '0', overflow: 'hidden' } }), toolbar = document.createElement('form'), status = document.createElement('div'), kosong = document.createElement('div'), pages = document.createElement('div');
  Object.assign(el.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md }); Object.assign(toolbar.style, { display: 'flex', gap: token.jarak.md, padding: token.jarak.md, flexWrap: 'wrap', alignItems: 'flex-end' });
  const fStatus = bidang({ id: 'riwayat-status', label: R.filterStatus, opsi: [{ nilai: '', label: R.semuaStatus }, ...['diajukan', 'ditelaah', 'siap', 'diserahkan'].map(s => ({ nilai: s, label: STATUS_RESEP.label(s) }))], ubah(v) { draf.status = v; } });
  const dari = bidang({ id: 'riwayat-dari', label: R.dari, jenis: 'date', ubah(v) { draf.dari = v; periode(); } }), sampai = bidang({ id: 'riwayat-sampai', label: R.sampai, jenis: 'date', ubah(v) { draf.sampai = v; periode(); } });
  const terapkan = tombol('Terapkan'); terapkan.type = 'submit';
  const reset = tombol('Atur ulang', () => { draf = { ...awal }; terapan = { ...awal }; fStatus.kontrol.value = dari.kontrol.value = sampai.kontrol.value = ''; periode(); void muat(); }, 'sekunder');
  function periode() { const terbalik = !!draf.dari && !!draf.sampai && draf.dari > draf.sampai; sampai.setGalat(terbalik ? 'Tanggal akhir sebelum tanggal awal.' : undefined); terapkan.disabled = terbalik; }
  toolbar.addEventListener('submit', e => { e.preventDefault(); if (terapkan.disabled) return; terapan = { ...draf, halaman: 1 }; void muat(); }); toolbar.append(fStatus.el, dari.el, sampai.el, terapkan, reset);
  const table = tabel(['nomor', 'pasien', 'dokter', 'item', 'status', 'waktu'].map(k => ({ judul: R.kolom[k] })).concat({ judul: 'Tindakan' }), FARMASI.tab.riwayat);
  const catatan = document.createElement('p'); catatan.textContent = R.catatan; Object.assign(catatan.style, { margin: '0', color: token.warna.teksRedup }); Object.assign(kosong.style, { padding: token.jarak.md, color: token.warna.teksRedup }); box.append(toolbar, status, table.el, kosong, pages); el.append(box, catatan); wadah.append(el);
  async function muat() {
    const id = ++urut;
    try { const h = await riwayatObat({ status: terapan.status || undefined, dari: terapan.dari || undefined, sampai: terapan.sampai || undefined, halaman: terapan.halaman, ukuran: 20 }); if (!aktif || id !== urut) return; status.replaceChildren(); table.tbody.replaceChildren();
      for (const r of h.data) {
        const nomor = sel(r.nomor_resep); nomor.style.fontWeight = token.huruf.berat.tebal;
        const pasien = sel(), nama = document.createElement('div'), rm = document.createElement('div'); nama.textContent = r.pasien_nama; rm.textContent = r.pasien_nomor_rm; Object.assign(rm.style, { color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }); pasien.append(nama, rm);
        const item = sel(), teks = document.createElement('div'), daftar = document.createElement('div'); teks.textContent = r.teks.trim() || '-'; Object.assign(teks.style, { whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }); daftar.textContent = r.item.length ? r.item.map(i => `${i.nama} ${i.jumlah} ${i.satuan}`).join('; ') : FARMASI.resep.belumAdaItem; Object.assign(daftar.style, { color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }); item.append(teks, daftar);
        const aksi = sel(); if (r.status === 'siap' && boleh('farmasi', 'input')) aksi.append(tombol('Serahkan obat', () => { modal = bukaSerahTerimaObat({ kunjunganId: r.kunjungan_id, pasien: { nama: r.pasien_nama, nomor_rm: r.pasien_nomor_rm }, onTutup() { modal = undefined; }, onSelesai() { modal = undefined; void muat(); } }); }, 'sekunder'));
        table.tbody.append(baris(nomor, pasien, sel(r.dpjp_nama ?? '-'), item, sel(lencana(STATUS_RESEP.label(r.status), STATUS_RESEP.warna(r.status))), sel(formatWaktu(r.dibuat_pada)), aksi));
      }
      kosong.textContent = h.data.length ? '' : R.kosong; kosong.hidden = !!h.data.length; pages.replaceChildren(); const p = paginasi(terapan.halaman, h.total, h.ukuran, n => { terapan = { ...terapan, halaman: n }; void muat(); }); if (p) pages.append(p);
    } catch (e) { if (aktif && id === urut) status.replaceChildren(peringatan(e instanceof GalatApi ? e.message : R.gagalMuat)); }
  }
  void muat(); return { tutup() { aktif = false; urut++; modal?.tutup(); el.remove(); } };
}
