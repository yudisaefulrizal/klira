import { ordersKunjungan } from '../../api-klien/penunjang.js';
import { GalatApi } from '../../api-klien/klien.js';
import { peringatan } from '../../komponen/ui/primitif.js';
import { token } from '../../gaya/token.js';
import { DaftarOrderLab } from './daftar-order-lab.js';

export function HasilPenunjangKunjungan({ kunjunganId }) {
  const el = document.createElement('div'), judul = document.createElement('strong'), isi = document.createElement('div');
  let aktif = true, versi = 0;
  Object.assign(el.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md }); judul.textContent = 'Hasil penunjang'; el.append(judul, isi);
  async function muat(id) { const saat = ++versi; isi.replaceChildren('Memuat hasil penunjang…'); try { const data = await ordersKunjungan(id); if (!aktif || saat !== versi) return; const orders = data.filter(o => o.hasil); isi.replaceChildren(); if (!orders.length) isi.append('Belum ada hasil penunjang.'); isi.append(DaftarOrderLab({ orders })); } catch (e) { if (aktif && saat === versi) isi.replaceChildren(peringatan(e instanceof GalatApi ? e.message : 'Hasil penunjang gagal dimuat.')); } }
  el.perbarui = ({ kunjunganId: id }) => muat(id); el.tutup = () => { aktif = false; versi++; }; void muat(kunjunganId); return el;
}
