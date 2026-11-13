import { laporanKeCsv, REKAM_MEDIS, TOMBOL } from '@klira/shared';
import { buatLaporan } from '../../api-klien/dokumen-rm.js';
import { GalatApi } from '../../api-klien/klien.js';
import { token } from '../../gaya/token.js';
import { bukaModal1 } from '../../komponen/modal-1/modal-1.js';
import { bidang, tombol, tabel, baris, sel, peringatan } from '../../komponen/ui/primitif.js';
import { unduhTeks } from '../../util/unduh.js';
import { awalLaporan, galatLaporan } from './keadaan-dokumen.js';
export function bukaLaporanRm({ onTutup }) {
  const L = REKAM_MEDIS.dok.laporan; let k = awalLaporan(), hasil = null, proses = false, aktif = true;
  const modal = bukaModal1({ judul: L.judul, lebar: 'modalBesar', onTutup() { aktif = false; modal.tutup(); onTutup(); } }), status = document.createElement('div'), form = document.createElement('form'), contenu = document.createElement('div'); form.noValidate = true; Object.assign(form.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md }); const p = document.createElement('small'); p.textContent = L.petunjuk; p.style.color = token.warna.teksRedup; const row = document.createElement('div'); Object.assign(row.style, { display: 'flex', gap: token.jarak.md, flexWrap: 'wrap' }); form.append(p, row);
  const controls = new Map(); for (const nom of ['jenis', 'dari', 'sampai']) { const f = bidang({ id: `lap-${nom}`, label: L[nom], nilai: k[nom], jenis: nom === 'jenis' ? 'text' : 'date', opsi: nom === 'jenis' ? Object.entries(L.jenisLabel).map(([nilai, label]) => ({ nilai, label })) : undefined, ubah(v) { k = { ...k, [nom]: v }; for (const [n, field] of controls) field.setGalat(galatLaporan(k)[n]); } }); controls.set(nom, f); row.append(f.el); }
  const unduh = tombol(L.unduh, () => { if (hasil) unduhTeks(`laporan-${hasil.jenis}-${hasil.dari}-${hasil.sampai}.csv`, laporanKeCsv(hasil)); }, 'sekunder'); unduh.hidden = true; const buat = tombol(L.buat, kirim);
  async function kirim() { if (proses || Object.keys(galatLaporan(k)).length) return; proses = true; buat.disabled = true; buat.textContent = L.membuat; status.replaceChildren(); try { const h = await buatLaporan({ jenis: k.jenis, dari: k.dari || undefined, sampai: k.sampai || undefined }); if (!aktif) return; hasil = h; unduh.hidden = false; const table = tabel(h.kolom.map((judul, i) => ({ judul, rataKanan: i === h.kolom.length - 1 })), L.judul); for (const r of h.baris) table.tbody.append(baris(...r.map((val, i) => { const td = sel(val); if (i === r.length - 1) td.style.textAlign = 'right'; return td; }))); contenu.replaceChildren(`${L.jenisLabel[h.jenis]} · ${L.rentang(h.dari, h.sampai)} · ${L.total(h.total)}`, table.el); if (!h.baris.length) contenu.append(L.kosong); } catch (e) { if (aktif) status.replaceChildren(peringatan(e instanceof GalatApi ? e.message : L.gagal)); } finally { proses = false; buat.disabled = false; buat.textContent = L.buat; } }
  form.addEventListener('submit', e => { e.preventDefault(); void kirim(); }); modal.isi.append(status, form, contenu); modal.aksi.append(unduh, tombol(TOMBOL.tutup, modal.mintaTutup, 'sekunder'), buat); modal.fokus(); return { tutup() { aktif = false; modal.tutup(); } };
}
