import { BAGIAN_KLINIS, KLINIS } from '@klira/shared';
import { ambilKlinis } from '../../api-klien/klinis.js';
import { GalatApi } from '../../api-klien/klien.js';
import { InfoPengesahan } from '../../komponen/info-pengesahan/info-pengesahan.js';
import { DaftarRingkasan } from '../../komponen/ui/susunan.js';
import { tombol, peringatan } from '../../komponen/ui/primitif.js';
import { token } from '../../gaya/token.js';
import { tanggalWaktuPendek } from '../../util/format.js';
import { LABEL_BAGIAN, keadaanDariServer, ringkasanIsi } from '../pemeriksaan/keadaan-pemeriksaan.js';
import { HasilPenunjangKunjungan } from '../penunjang/hasil-penunjang-kunjungan.js';
import { RingkasanOrderKunjungan } from '../penunjang/ringkasan-order-kunjungan.js';
import { bukaCetakRekamMedis } from './cetak-rekam-medis.js';
import { bagianRawatInap, muatDataRawatInap } from '../rawat-inap/data-rawat-inap.js';

export function DetailKunjungan({ kunjunganId }) {
  const el = document.createElement('div'); Object.assign(el.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md }); let aktif = true, versi = 0, cetak, enfants = [];
  function nettoyer() { for (const c of enfants) c.tutup?.(); enfants = []; cetak?.tutup(); cetak = undefined; }
  async function muat(id) { const saat = ++versi; nettoyer(); el.replaceChildren(KLINIS.detail.memuat); try { const d = await ambilKlinis(id), inap = d.kunjungan.jenis === 'IMP' ? await muatDataRawatInap(id) : null; if (!aktif || saat !== versi) return; const commandes = document.createElement('div'); commandes.append(tombol(KLINIS.cetak.tombol, () => { cetak = bukaCetakRekamMedis({ kunjunganId: id, onTutup() { cetak = undefined; } }); }, 'sekunder')); const order = RingkasanOrderKunjungan({ kunjunganId: id }), hasil = HasilPenunjangKunjungan({ kunjunganId: id }); enfants.push(order, hasil); el.replaceChildren(commandes, ...(inap ? [DaftarRingkasan({ bagian: bagianRawatInap(inap) })] : []), DaftarRingkasan({ bagian: ringkasanIsi(keadaanDariServer(d.bagian)) }), order, hasil); for (const b of BAGIAN_KLINIS.filter(b => d.bagian[b]?.pengesahan)) { const box = document.createElement('div'), h = document.createElement('strong'), date = document.createElement('span'); Object.assign(box.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.xs }); h.textContent = LABEL_BAGIAN[b]; date.textContent = tanggalWaktuPendek(d.bagian[b].pengesahan.waktu); box.append(h, InfoPengesahan({ bagian: d.bagian[b] }), date); el.append(box); } } catch (e) { if (aktif && saat === versi) el.replaceChildren(peringatan(e instanceof GalatApi ? e.message : KLINIS.detail.gagal)); } }
  el.perbarui = ({ kunjunganId: id }) => muat(id); el.tutup = () => { aktif = false; versi++; nettoyer(); }; void muat(kunjunganId); return el;
}
