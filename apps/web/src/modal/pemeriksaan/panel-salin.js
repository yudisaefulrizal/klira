import { KLINIS, NAVIGASI, TOMBOL } from '@klira/shared';
import { GalatApi } from '../../api-klien/klien.js';
import { riwayatKunjungan, salinanKunjungan } from '../../api-klien/klinis.js';
import { token } from '../../gaya/token.js';
import { bukaPanel } from '../../komponen/panel/panel.js';
import { KotakCentang } from '../../komponen/ui/kotak-centang.js';
import { tombol, peringatan } from '../../komponen/ui/primitif.js';
import { tanggalPendek } from '../../util/format.js';
import { bagianDapatDisalin } from './keadaan-pemeriksaan.js';

export function bukaPanelSalin({ kunjunganId, pasienId, onSalin, onTutup }) {
  const p = KLINIS.panel; let daftar = null, sumber = null, salinan = null, pilih = [], galat = null, info = null, memuat = false, aktif = true, versi = 0;
  function tutup() { aktif = false; versi++; panel.tutup(); onTutup(); }
  const panel = bukaPanel({ judul: p.salinJudul, onTutup: tutup, aksi: tombol(TOMBOL.tutup, tutup, 'sekunder') });
  async function pilihSumber(id) { const saat = ++versi; sumber = id; salinan = null; info = galat = null; memuat = true; tampil(); try { const s = await salinanKunjungan(kunjunganId, id); if (aktif && saat === versi) { salinan = s; pilih = bagianDapatDisalin(s); } } catch (e) { if (aktif && saat === versi) galat = e instanceof GalatApi ? e.message : p.salinGagal; } finally { if (aktif && saat === versi) { memuat = false; tampil(); } } }
  function paragraphe(teks) { const el = document.createElement('p'); el.textContent = teks; Object.assign(el.style, { margin: '0', color: token.warna.teksRedup }); return el; }
  function tampil() {
    panel.isi.replaceChildren(paragraphe(p.salinPetunjuk)); if (galat) panel.isi.append(peringatan(galat)); if (info) panel.isi.append(peringatan(info, 'biru'));
    if (!daftar && !galat) panel.isi.append(paragraphe(NAVIGASI.memuat)); if (daftar?.length === 0) panel.isi.append(paragraphe(p.salinKosong));
    if (daftar?.length) { const h = document.createElement('strong'); h.textContent = p.salinPilih; panel.isi.append(h); for (const r of daftar) { const b = tombol(`${tanggalPendek(r.mulai)} · ${r.keluhan_utama ?? '-'}`, () => pilihSumber(r.id), sumber === r.id ? 'utama' : 'sekunder'); Object.assign(b.style, { width: '100%', textAlign: 'left', height: 'auto', padding: token.jarak.sm }); b.setAttribute('aria-pressed', String(sumber === r.id)); panel.isi.append(b); } }
    if (memuat) panel.isi.append(paragraphe(NAVIGASI.memuat));
    if (salinan) { const tersedia = bagianDapatDisalin(salinan); if (!tersedia.length) panel.isi.append(paragraphe(p.salinTidakAda)); else { const h = document.createElement('strong'); h.textContent = p.salinBagian; panel.isi.append(h); const salin = tombol(p.salinTombol, () => { info = p.salinBerhasil(onSalin(salinan, pilih)); tampil(); }); salin.disabled = !pilih.length; for (const b of tersedia) panel.isi.append(KotakCentang({ id: `salin-${b}`, label: KLINIS.langkah[b], checked: pilih.includes(b), onChange(e) { pilih = e.target.checked ? [...pilih.filter(y => y !== b), b] : pilih.filter(y => y !== b); salin.disabled = !pilih.length; } })); panel.isi.append(salin); } }
  }
  tampil(); riwayatKunjungan(pasienId, kunjunganId).then(d => { if (aktif) { daftar = d; tampil(); } }).catch(e => { if (aktif) { galat = e instanceof GalatApi ? e.message : p.salinGagal; tampil(); } }); return { tutup() { aktif = false; versi++; panel.tutup(); } };
}
