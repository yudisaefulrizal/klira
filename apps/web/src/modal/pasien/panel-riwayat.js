import { JENIS_KUNJUNGAN, KLINIS, NAVIGASI, STATUS_PERAN_DIAGNOSIS, TOMBOL } from '@klira/shared';
import { GalatApi } from '../../api-klien/klien.js';
import { riwayatKunjungan } from '../../api-klien/klinis.js';
import { token } from '../../gaya/token.js';
import { bukaPanel } from '../../komponen/panel/panel.js';
import { kartu, tombol, lencana, peringatan } from '../../komponen/ui/primitif.js';
import { DetailKunjungan } from '../rekam-medis/detail-kunjungan.js';
import { tanggalPendek } from '../../util/format.js';
export function bukaPanelRiwayat({ pasienId, nama, kecualiKunjunganId, onTutup }) {
  const P = KLINIS.panel; let aktif = true, ouvert = null; const details = new Map();
  function nettoyer() { for (const d of details.values()) d.el?.tutup(); }
  function tutup() { aktif = false; nettoyer(); panel.tutup(); onTutup(); }
  const panel = bukaPanel({ judul: `${P.riwayatJudul}: ${nama}`, onTutup: tutup, aksi: tombol(TOMBOL.tutup, tutup, 'sekunder') }), status = document.createElement('div'); panel.isi.append(peringatan(P.riwayatTercatat, 'biru'), status); status.append(NAVIGASI.memuat);
  riwayatKunjungan(pasienId, kecualiKunjunganId).then(data => { if (!aktif) return; status.replaceChildren(); if (!data.length) status.append(P.riwayatKosong); for (const r of data) { const box = kartu({ susun: 'sm' }), row = document.createElement('div'), title = document.createElement('strong'); Object.assign(row.style, { display: 'flex', gap: token.jarak.sm, flexWrap: 'wrap' }); title.textContent = tanggalPendek(r.mulai); title.style.flexGrow = '1'; row.append(title, r.poli_nama ?? '', lencana(JENIS_KUNJUNGAN.label(r.jenis), JENIS_KUNJUNGAN.warna(r.jenis))); box.append(row); for (const [label, valeur] of [[P.keluhan, r.keluhan_utama ?? '-'], [P.diagnosis, !r.diagnosis.length ? P.tanpaDiagnosis : r.diagnosis.map(d => `${d.kode} ${d.nama}${d.peran === 'utama' ? '' : ` (${STATUS_PERAN_DIAGNOSIS.label(d.peran)})`}`).join('; ')], ...(r.tindak_lanjut ? [[P.tindakLanjut, KLINIS.tindakLanjut.jenisOpsi.find(o => o.nilai === r.tindak_lanjut)?.label ?? r.tindak_lanjut]] : [])]) { const el = document.createElement('div'), nom = document.createElement('span'); nom.textContent = `${label}: `; nom.style.color = token.warna.teksRedup; el.append(nom, valeur); box.append(el); }
    const slot = document.createElement('div'), b = tombol(KLINIS.detail.lihat, () => { for (const [id, item] of details) if (id !== r.id || ouvert === r.id) { item.el?.tutup(); item.el = undefined; item.slot.replaceChildren(); item.button.textContent = KLINIS.detail.lihat; } if (ouvert === r.id) ouvert = null; else { ouvert = r.id; const item = details.get(r.id); item.el = DetailKunjungan({ kunjunganId: r.id }); slot.append(item.el); b.textContent = KLINIS.detail.tutup; } }, 'teks'); details.set(r.id, { slot, button: b, el: undefined }); box.append(b, slot); panel.isi.append(box);
  } }).catch(e => { if (aktif) status.replaceChildren(peringatan(e instanceof GalatApi ? e.message : P.riwayatGagal)); }); return { tutup() { aktif = false; nettoyer(); panel.tutup(); } };
}
