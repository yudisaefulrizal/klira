import { FARMASI, STATUS_STOK } from '@klira/shared';
import { daftarMasterObat, ubahMasterObat } from '../../api-klien/farmasi.js';
import { GalatApi } from '../../api-klien/klien.js';
import { izinSaatIni } from '../../komponen/izin-saja.js';
import { bidang, kartu, tombol, tabel, baris, sel, lencana, peringatan, paginasi } from '../../komponen/ui/primitif.js';
import { token } from '../../gaya/token.js';
import { bukaMasterObat } from '../../modal/farmasi/master-obat.js';
import { bukaMutasiStok } from '../../modal/farmasi/mutasi-stok.js';
import { rupiah } from '../../modal/penunjang/keadaan-order-lab.js';

export function pasangTabMasterObat(wadah) {
  const M = FARMASI.master, boleh = izinSaatIni(), el = document.createElement('div'), toolbar = document.createElement('div'), status = document.createElement('div'), box = kartu({ style: { padding: '0', overflow: 'hidden' } }), kosong = document.createElement('div'), pages = document.createElement('div');
  let cari = '', halaman = 1, aktif = true, timer, urut = 0, modal;
  Object.assign(el.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md }); Object.assign(toolbar.style, { display: 'flex', gap: token.jarak.md, alignItems: 'flex-end', flexWrap: 'wrap' });
  const pencarian = bidang({ id: 'cari-obat', label: M.cari, jenis: 'search', autoComplete: 'off', ubah(v) { cari = v; halaman = 1; jadwal(); } }); pencarian.el.style.flexGrow = '1'; toolbar.append(pencarian.el);
  const table = tabel(['nama', 'kfa', 'satuan', 'harga', 'stok', 'kedaluwarsa', 'status', 'tindakan'].map(k => ({ judul: M.kolom[k], rataKanan: k === 'tindakan' })), FARMASI.tab.master);
  function selesai() { modal = undefined; jadwal(); }
  function buka(obat, mutasi = false) { const props = { obat, onTutup() { modal = undefined; }, onSelesai: selesai }; modal = mutasi ? bukaMutasiStok(props) : bukaMasterObat(props); }
  if (boleh('farmasi', 'input')) toolbar.append(tombol(M.tambah, () => buka()));
  const catatan = document.createElement('p'); catatan.textContent = M.catatan; Object.assign(catatan.style, { margin: '0', color: token.warna.teksRedup }); Object.assign(kosong.style, { padding: token.jarak.md, color: token.warna.teksRedup }); box.append(table.el, kosong, pages); el.append(toolbar, status, box, catatan); wadah.append(el);
  function jadwal() { clearTimeout(timer); const id = ++urut; timer = setTimeout(() => muat(id), 250); }
  async function muat(id) {
    try { const h = await daftarMasterObat({ cari, halaman, ukuran: 20 }); if (!aktif || id !== urut) return; status.replaceChildren(); table.tbody.replaceChildren();
      for (const o of h.data) {
        const nom = sel(o.nama_tampil); nom.style.fontWeight = token.huruf.berat.tebal; const stok = sel(o.stok_total); stok.style.fontWeight = token.huruf.berat.tebal;
        const keadaan = sel(lencana(STATUS_STOK.label(o.status_stok), STATUS_STOK.warna(o.status_stok))); if (!o.aktif) keadaan.append(' ', lencana(M.nonaktif, 'abu'));
        const aksi = sel(), row = document.createElement('div'); Object.assign(row.style, { display: 'flex', gap: token.jarak.sm, justifyContent: 'flex-end', flexWrap: 'wrap' }); aksi.style.textAlign = 'right';
        if (boleh('farmasi', 'input')) row.append(tombol(M.mutasi, () => buka(o, true), 'teks'));
        if (boleh('farmasi', 'perbaikan')) row.append(tombol(M.ubah, () => buka(o), 'teks'), tombol(o.aktif ? M.nonaktifkan : M.aktifkan, async () => { try { await ubahMasterObat(o.id, { aktif: !o.aktif }); if (aktif) jadwal(); } catch (e) { if (aktif) status.replaceChildren(peringatan(e instanceof GalatApi ? e.message : M.gagalMuat)); } }, 'teks'));
        aksi.append(row); table.tbody.append(baris(nom, sel(o.kfa_kode), sel(o.satuan), sel(rupiah(o.harga)), stok, sel(o.kedaluwarsa_terdekat ?? '-'), keadaan, aksi));
      }
      kosong.textContent = h.data.length ? '' : M.kosong; kosong.hidden = !!h.data.length; pages.replaceChildren(); const p = paginasi(halaman, h.total, h.ukuran, n => { halaman = n; jadwal(); }); if (p) pages.append(p);
    } catch (e) { if (aktif && id === urut) status.replaceChildren(peringatan(e instanceof GalatApi ? e.message : M.gagalMuat)); }
  }
  jadwal(); return { tutup() { aktif = false; urut++; clearTimeout(timer); modal?.tutup(); el.remove(); } };
}
