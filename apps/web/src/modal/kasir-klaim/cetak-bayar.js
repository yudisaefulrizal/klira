import { KASIR, METODE_BAYAR } from '@klira/shared';
import { tombol } from '../../komponen/ui/primitif.js';
import { bukaTabCetak } from '../../util/cetak-tab.js';
import { penggunaSaatIni } from '../../util/sesi/konteks-pengguna.js';
import { formatWaktu } from '../../util/tab/penyaring-tab.js';
import { rupiah } from '../penunjang/keadaan-order-lab.js';
import { susunBuktiBayar } from './keadaan-cetak-bayar.js';

const C = KASIR.cetakBayar;
const el = (tag, kelas, teks) => { const e = document.createElement(tag); if (kelas) e.className = kelas; if (teks !== undefined) e.textContent = teks; return e; };
const baris = (kiri, kanan, kelas = '') => { const r = el('div', `cby-baris ${kelas}`.trim()); r.append(el('span', '', kiri), el('span', '', kanan)); return r; };

/** Struk bukti pembayaran satu kunjungan, dibuka di tab baru (atau dialog bila pop-up diblokir) untuk dicetak (kertas 80 mm). */
export function bukaCetakBayar({ gambaran, onTutup }) {
  const b = susunBuktiBayar(gambaran), oleh = penggunaSaatIni().pengguna?.nama ?? null, avant = document.activeElement;
  const cssHref = new URL('./cetak-bayar.css', import.meta.url).href;
  const tabCetak = bukaTabCetak({ judul: C.judul, cssHref, onTutup });
  if (!tabCetak && !document.querySelector('link[data-cetak-bayar]')) { const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = cssHref; css.dataset.cetakBayar = ''; document.head.append(css); }
  const lapis = el('div', 'cby-lapis'), alat = el('div', 'cby-alat'), struk = el('div', 'cby-struk');
  lapis.setAttribute('role', 'dialog'); lapis.setAttribute('aria-modal', 'true'); lapis.setAttribute('aria-label', C.judul);
  function hancurkan() { document.removeEventListener('keydown', tekan); lapis.remove(); tabCetak?.hancurkan(); if (!tabCetak && avant?.isConnected) avant.focus(); }
  function tutup() { if (tabCetak) { tabCetak.tutup(); return; } hancurkan(); onTutup?.(); }
  function tekan(e) { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); tutup(); } }
  const judul = el('strong', '', C.judul), ruang = el('span', 'cby-tumbuh');
  alat.append(judul, ruang, tombol(C.tutup, tutup, 'sekunder'), tombol(C.cetak, () => (tabCetak ? tabCetak.cetak() : window.print())));

  if (b.klinik) struk.append(el('h1', '', b.klinik));
  struk.append(el('h2', '', C.judulStruk), el('hr', 'cby-garis'));
  struk.append(baris(C.tanggal, b.waktu ? formatWaktu(b.waktu) : '-'), baris(C.kunjungan, `#${b.kunjunganId}`), baris(C.pasien, b.pasien), baris(C.noRm, b.nomorRm));
  struk.append(el('hr', 'cby-garis'));
  for (const i of b.item) { struk.append(el('div', '', i.nama), baris(`  ${i.jumlah} x ${rupiah(i.harga)}`, rupiah(i.subtotal), 'cby-redup')); }
  struk.append(el('hr', 'cby-garis'), baris(C.total, rupiah(b.total), 'cby-tebal'));
  for (const p of b.pembayaran) struk.append(baris(METODE_BAYAR.label(p.metode), rupiah(p.jumlah)));
  struk.append(baris(C.dibayar, rupiah(b.dibayar)));
  if (b.sisa > 0) struk.append(baris(C.sisa, rupiah(b.sisa), 'cby-tebal'));
  struk.append(el('hr', 'cby-garis'), el('div', 'cby-tengah cby-tebal', b.lunas ? C.lunas : C.belumLunas));
  if (b.kasir) struk.append(baris(C.kasir, b.kasir, 'cby-redup'));
  struk.append(el('div', 'cby-tengah', C.terima), el('div', 'cby-tengah cby-redup', C.dicetak(oleh, formatWaktu(new Date().toISOString()))));

  lapis.append(alat, struk);
  if (tabCetak) tabCetak.body.append(lapis);
  else { document.body.append(lapis); document.addEventListener('keydown', tekan); lapis.querySelector('button:last-of-type')?.focus(); }
  return { tutup: hancurkan };
}
