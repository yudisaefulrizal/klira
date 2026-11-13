import { STATUS_RESEP, STATUS_ORDER_PENUNJANG } from '@klira/shared';
import { resepKunjungan } from '../../api-klien/farmasi.js';
import { daftarMasterPemeriksaan, ordersKunjungan } from '../../api-klien/penunjang.js';
import { GalatApi } from '../../api-klien/klien.js';
import { DaftarRingkasan } from '../../komponen/ui/susunan.js';
import { peringatan } from '../../komponen/ui/primitif.js';
import { token } from '../../gaya/token.js';
import { adaIsianResep } from '../farmasi/keadaan-farmasi.js';
import { awalKeadaan } from '../pemeriksaan/keadaan-pemeriksaan.js';
import { TampilanResep } from '../farmasi/tampilan-resep.js';

export function RingkasanOrderKunjungan(awal) {
  let { kunjunganId, k = awalKeadaan() } = awal, data = null, galat = null, aktif = true, versi = 0;
  const el = document.createElement('div'); Object.assign(el.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md });
  function tampil() {
    el.replaceChildren(); if (galat) el.append(peringatan(galat)); if (!data && !galat) el.append('Memuat rincian obat dan lab…');
    const pilihan = [];
    if (adaIsianResep(k.resep)) pilihan.push({ judul: 'Resep', baris: [{ label: 'Resep dokter', nilai: k.resep.trim() }] });
    if (k.lab_dipilih) pilihan.push({ judul: 'Lab', baris: [...k.order_lab.pemeriksaan.map(id => ({ label: 'Pemeriksaan', nilai: data?.lab.find(m => m.id === id)?.nama ?? `Pemeriksaan #${id}` })), ...(k.order_lab.pemeriksaan.length ? [] : [{ label: 'Pemeriksaan', nilai: 'Belum dipilih' }]), ...(k.order_lab.catatan.trim() ? [{ label: 'Catatan untuk laboratorium', nilai: k.order_lab.catatan }] : [])] });
    if (data || galat) el.append(DaftarRingkasan({ bagian: pilihan }));
    if (data && (data.resep.length || data.order.length)) { const h = document.createElement('strong'); h.textContent = 'Resep dan lab tersimpan'; el.append(h); for (const r of data.resep) { const row = document.createElement('div'), label = document.createElement('small'); Object.assign(row.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.xs }); label.textContent = `${r.nomor_resep} · ${r.status === 'diajukan' ? 'Menunggu farmasi' : STATUS_RESEP.label(r.status)}`; row.append(label, TampilanResep({ resep: r })); el.append(row); } for (const o of data.order) { const row = document.createElement('span'); row.textContent = `${o.nama} · ${STATUS_ORDER_PENUNJANG.label(o.status)}${o.hasil ? ` · ${o.hasil.nilai}${o.hasil.satuan ? ` ${o.hasil.satuan}` : ''}` : ''}`; el.append(row); } }
  }
  async function muat() { const saat = ++versi; data = null; galat = null; tampil(); try { const [resep, order, lab] = await Promise.all([resepKunjungan(kunjunganId), ordersKunjungan(kunjunganId), k.lab_dipilih ? daftarMasterPemeriksaan({ aktif: true }) : Promise.resolve([])]); if (aktif && saat === versi) { data = { resep, order, lab }; tampil(); } } catch (e) { if (aktif && saat === versi) { galat = e instanceof GalatApi ? e.message : 'Rincian obat dan lab gagal dimuat.'; tampil(); } } }
  el.perbarui = baru => { const muatLagi = baru.kunjunganId !== kunjunganId || !!baru.k.lab_dipilih !== !!k.lab_dipilih; kunjunganId = baru.kunjunganId; k = baru.k; if (muatLagi) void muat(); else tampil(); }; el.tutup = () => { aktif = false; versi++; }; void muat(); return el;
}
