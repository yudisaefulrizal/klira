import { PENUNJANG } from '@klira/shared';
import { ordersKunjungan } from '../../api-klien/penunjang.js';
import { pesanGalat } from '../../api-klien/klien.js';
import { peringatan, tombol } from '../../komponen/ui/primitif.js';
import { token } from '../../gaya/token.js';
import { bukaCetakHasilLab } from './cetak-hasil-lab.js';
import { DaftarOrderLab } from './daftar-order-lab.js';
import { bisaCetakHasilLab } from './keadaan-cetak-lab.js';

export function HasilPenunjangKunjungan({ kunjunganId, pasien, kunjungan }) {
  const el = document.createElement('div'), kepala = document.createElement('div'), judul = document.createElement('strong'), isi = document.createElement('div');
  let aktif = true, versi = 0, modal;
  Object.assign(el.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md });
  Object.assign(kepala.style, { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: token.jarak.sm });
  judul.textContent = 'Hasil penunjang'; kepala.append(judul); el.append(kepala, isi);
  async function muat(id) {
    const saat = ++versi; kepala.replaceChildren(judul); isi.replaceChildren('Memuat hasil penunjang…');
    try {
      const data = await ordersKunjungan(id);
      if (!aktif || saat !== versi) return;
      const orders = data.filter(o => o.hasil);
      if (bisaCetakHasilLab(orders)) kepala.append(tombol(PENUNJANG.cetak.tombol, () => { modal?.tutup(); modal = bukaCetakHasilLab({ kunjunganId: id, orders: data, pasien, kunjungan: { id, ...kunjungan }, onTutup() { modal = undefined; } }); }, 'sekunder'));
      isi.replaceChildren();
      if (!orders.length) isi.append('Belum ada hasil penunjang.');
      isi.append(DaftarOrderLab({ orders }));
    } catch (e) { if (aktif && saat === versi) isi.replaceChildren(peringatan(pesanGalat(e, 'Hasil penunjang gagal dimuat.'))); }
  }
  el.perbarui = ({ kunjunganId: id }) => muat(id); el.tutup = () => { aktif = false; versi++; modal?.tutup(); }; void muat(kunjunganId); return el;
}
