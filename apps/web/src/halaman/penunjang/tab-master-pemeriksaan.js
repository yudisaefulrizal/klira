import { PENUNJANG } from '@klira/shared';
import { daftarMasterPemeriksaan, ubahMasterPemeriksaan } from '../../api-klien/penunjang.js';
import { GalatApi } from '../../api-klien/klien.js';
import { izinSaatIni } from '../../komponen/izin/izin-saja.js';
import { bidang, kartu, tombol, tabel, baris, sel, lencana, peringatan } from '../../komponen/ui/primitif.js';
import { token } from '../../gaya/token.js';
import { bukaMasterPemeriksaan } from '../../modal/penunjang/master-pemeriksaan.js';
import { rupiahAtau } from '../../modal/penunjang/keadaan-order-lab.js';

export function pasangTabMasterPemeriksaan(wadah) {
  const M = PENUNJANG.master, boleh = izinSaatIni(), el = document.createElement('div'), toolbar = document.createElement('div'), status = document.createElement('div'), box = kartu({ style: { padding: '0', overflow: 'hidden' } }), kosong = document.createElement('div');
  let cari = '', aktif = true, timer, urut = 0, modal;
  Object.assign(el.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md }); Object.assign(toolbar.style, { display: 'flex', gap: token.jarak.md, alignItems: 'flex-end', flexWrap: 'wrap' });
  const pencarian = bidang({ id: 'cari-master', label: M.cari, jenis: 'search', autoComplete: 'off', ubah(v) { cari = v; jadwal(); } }); toolbar.append(pencarian.el);
  function buka(master) { modal = bukaMasterPemeriksaan({ master, onTutup() { modal = undefined; }, onSelesai() { modal = undefined; jadwal(); } }); }
  if (boleh('penunjang', 'input')) toolbar.append(tombol(M.tambah, () => buka()));
  const table = tabel(['kode', 'nama', 'loinc', 'satuan', 'rujukan', 'tarif', 'status', 'tindakan'].map(k => ({ judul: M.kolom[k], rataKanan: k === 'tindakan' })), M.judul);
  Object.assign(kosong.style, { padding: token.jarak.md, color: token.warna.teksRedup }); box.append(table.el, kosong); el.append(toolbar, status, box); wadah.append(el);
  function jadwal() { clearTimeout(timer); const id = ++urut; timer = setTimeout(() => muat(id), 250); }
  async function muat(id) { try { const data = await daftarMasterPemeriksaan({ cari }); if (!aktif || id !== urut) return; status.replaceChildren(); table.tbody.replaceChildren(); for (const m of data) {
    const kode = sel(m.kode); kode.style.fontWeight = token.huruf.berat.tebal; const aksi = sel(); aksi.style.textAlign = 'right';
    if (boleh('penunjang', 'perbaikan')) { const row = document.createElement('div'); Object.assign(row.style, { display: 'flex', gap: token.jarak.sm, justifyContent: 'flex-end' }); row.append(tombol(M.ubah, () => buka(m), 'teks'), tombol(m.aktif ? M.nonaktifkan : M.aktifkan, async () => { try { await ubahMasterPemeriksaan(m.id, { aktif: !m.aktif }); if (aktif) jadwal(); } catch (e) { if (aktif) status.replaceChildren(peringatan(e instanceof GalatApi ? e.message : M.gagalMuat)); } }, 'teks')); aksi.append(row); }
    const rujukan = m.rujukan_teks ?? (m.rujukan_min !== null || m.rujukan_maks !== null ? `${m.rujukan_min ?? ''} - ${m.rujukan_maks ?? ''}` : '-');
    table.tbody.append(baris(kode, sel(m.nama), sel(m.kode_loinc ?? '-'), sel(m.satuan ?? '-'), sel(rujukan), sel(m.tarif ? rupiahAtau(m.tarif.harga_umum) : M.tanpaTarif), sel(lencana(m.aktif ? M.aktif : M.nonaktif, m.aktif ? 'hijau' : 'abu')), aksi));
  } kosong.hidden = !!data.length; kosong.textContent = data.length ? '' : M.kosong; } catch (e) { if (aktif && id === urut) status.replaceChildren(peringatan(e instanceof GalatApi ? e.message : M.gagalMuat)); } }
  jadwal(); return { tutup() { aktif = false; urut++; clearTimeout(timer); modal?.tutup(); el.remove(); } };
}
