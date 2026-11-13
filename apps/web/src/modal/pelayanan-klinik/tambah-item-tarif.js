import { KASIR } from '@klira/shared';
import { tambahItemTagihan } from '../../api-klien/kasir.js';
import { GalatApi } from '../../api-klien/klien.js';
import { token } from '../../gaya/token.js';
import { bidang, tombol, peringatan } from '../../komponen/ui/primitif.js';
import { galatTambahItem } from './keadaan-kasir.js';
import { rupiahAtau } from './keadaan-order-lab.js';

export function TambahItemTarif({ kunjunganId, gambaran, onUbah }) {
  const T = KASIR.tambah, el = document.createElement('div'), status = document.createElement('div'), row = document.createElement('div');
  let tarifId = '', jumlah = '1', proses = false, aktif = true;
  Object.assign(el.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.sm, padding: token.jarak.md, border: `${token.ukuran.garis} solid ${token.warna.garisHalus}`, borderRadius: token.radius.sedang });
  const h = document.createElement('strong'); h.textContent = T.judul; const p = document.createElement('span'); p.textContent = T.petunjuk; Object.assign(p.style, { color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }); el.append(h, p, status, row);
  const tarif = bidang({ id: 'tambah-tarif', label: T.tarif, opsi: [{ nilai: '', label: T.pilih }, ...gambaran.tarif.map(t => ({ nilai: String(t.id), label: `${t.nama} · ${rupiahAtau(t.harga, T.tanpaHarga)}` }))], ubah(v) { tarifId = v; simpan.disabled = proses || !v; } }); tarif.el.style.flexGrow = '1';
  const angka = bidang({ id: 'tambah-jumlah', label: T.jumlah, nilai: jumlah, autoComplete: 'off', ubah(v) { jumlah = v; } }); angka.el.style.width = '96px'; angka.kontrol.inputMode = 'numeric';
  const simpan = tombol(T.simpan, tambah, 'sekunder'); simpan.disabled = true;
  Object.assign(row.style, { display: 'flex', gap: token.jarak.sm, alignItems: 'flex-end', flexWrap: 'wrap' });
  if (!gambaran.tarif.length) row.append(T.tanpaTarif); else row.append(tarif.el, angka.el, simpan);
  el.hidden = gambaran.kunjungan.tahap_layanan === 'ditutup';
  async function tambah() {
    if (proses) return; const g = galatTambahItem(tarifId, jumlah); if (g) { status.replaceChildren(peringatan(g)); return; }
    proses = true; tarif.kontrol.disabled = angka.kontrol.disabled = simpan.disabled = true; simpan.textContent = T.menyimpan; status.replaceChildren();
    try { const h = await tambahItemTagihan(kunjunganId, Number(tarifId), Number(jumlah)); if (aktif) { tarifId = ''; jumlah = '1'; tarif.kontrol.value = ''; angka.kontrol.value = '1'; onUbah(h); } }
    catch (e) { if (aktif) status.replaceChildren(peringatan(e instanceof GalatApi ? e.message : KASIR.bayar.gagal)); }
    finally { proses = false; tarif.kontrol.disabled = angka.kontrol.disabled = false; simpan.disabled = !tarifId; simpan.textContent = T.simpan; }
  }
  el.tutup = () => { aktif = false; }; return el;
}
