import { KASIR } from '@klira/shared';
import { lengkapiHargaItem } from '../../api-klien/kasir.js';
import { GalatApi } from '../../api-klien/klien.js';
import { token } from '../../gaya/token.js';
import { bidang, tombol, peringatan } from '../../komponen/ui/native.js';

export function LengkapiHarga({ kunjunganId, gambaran, onUbah }) {
  const L = KASIR.lengkapi, el = document.createElement('div'), status = document.createElement('div'), daftar = document.createElement('div');
  let aktif = true, proses = null;
  const nilai = new Map(), aksi = new Map();
  Object.assign(el.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.sm, padding: token.jarak.md, border: `${token.ukuran.garis} solid ${token.warna.garisHalus}`, borderRadius: token.radius.sedang });
  const h = document.createElement('strong'); h.textContent = L.judul;
  const petunjuk = document.createElement('span'); petunjuk.textContent = L.petunjuk; Object.assign(petunjuk.style, { color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil });
  const tautan = document.createElement('a'); tautan.href = '/kasir-klaim?tab=tarif'; tautan.textContent = L.tautanTarif; tautan.style.fontSize = token.huruf.ukuran.kecil;
  el.append(h, petunjuk, status, daftar, tautan);
  function sibuk(id) { proses = id; for (const [key, b] of aksi) { b.disabled = id !== null; b.textContent = key === id ? L.menyimpan : L.simpan; } }
  async function simpan(id) {
    if (proses !== null) return;
    const harga = (nilai.get(id) ?? '').trim();
    if (!/^\d+$/.test(harga)) { status.replaceChildren(peringatan(KASIR.galat.angka)); return; }
    sibuk(id); status.replaceChildren();
    try { const g = await lengkapiHargaItem(kunjunganId, id, harga); if (aktif) { perbarui(g); onUbah(g); } }
    catch (e) { if (aktif) status.replaceChildren(peringatan(e instanceof GalatApi ? e.message : KASIR.bayar.gagal)); }
    finally { if (aktif) sibuk(null); }
  }
  function perbarui(g) {
    gambaran = g; const kosong = g.tagihan.item.filter(i => i.harga === null); el.hidden = !kosong.length; daftar.replaceChildren(); aksi.clear();
    for (const i of kosong) {
      const ligne = document.createElement('div'); Object.assign(ligne.style, { display: 'flex', gap: token.jarak.sm, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: token.jarak.sm });
      const f = bidang({ id: `lengkapi-${i.id}`, label: L.harga(i.nama), nilai: nilai.get(i.id) ?? '', autoComplete: 'off', ubah(v) { nilai.set(i.id, v); } }); f.kontrol.inputMode = 'numeric'; f.el.style.flexGrow = '1';
      const b = tombol(L.simpan, () => simpan(i.id), 'sekunder'); aksi.set(i.id, b); ligne.append(f.el, b); daftar.append(ligne);
    }
    sibuk(proses);
  }
  el.perbarui = perbarui; el.tutup = () => { aktif = false; }; perbarui(gambaran); return el;
}
