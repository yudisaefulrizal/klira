import { KASIR, TOMBOL } from '@klira/shared';
import { serahHasil } from '../../api-klien/kasir.js';
import { GalatApi } from '../../api-klien/klien.js';
import { token } from '../../gaya/token.js';
import { bukaModal1 } from '../../komponen/modal-1/modal-1.js';
import { bidang, tombol, peringatan } from '../../komponen/ui/primitif.js';

/** Modal penyerahan hasil lab (penunjang saja): nama penerima wajib, hubungan opsional. `onSelesai` menerima gambaran kasir terbaru. */
export function bukaSerahHasil({ kunjunganId, pasienNama, onTutup, onSelesai }) {
  const S = KASIR.serahHasil;
  let k = { penerima: pasienNama ?? '', hubungan: '' }, dicoba = false, proses = false, aktif = true;
  const modal = bukaModal1({ judul: S.judul, onTutup() { aktif = false; modal.tutup(); onTutup?.(); } });
  const status = document.createElement('div'), form = document.createElement('form'); form.noValidate = true;
  Object.assign(form.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md });
  const petunjuk = document.createElement('span'); petunjuk.style.color = token.warna.teksRedup; petunjuk.textContent = pasienNama ? `${pasienNama}. ${S.petunjuk}` : S.petunjuk;
  const penerima = bidang({ id: 'serah-hasil-penerima', label: S.penerima, nilai: k.penerima, autoComplete: 'off', maxLength: 200, ubah(v) { k = { ...k, penerima: v }; perbarui(); } });
  const hubungan = bidang({ id: 'serah-hasil-hubungan', label: S.hubungan, nilai: k.hubungan, autoComplete: 'off', maxLength: 100, ubah(v) { k = { ...k, hubungan: v }; } });
  form.append(petunjuk, penerima.el, hubungan.el);
  const simpan = tombol(S.serahkan, kirim);
  function perbarui() { penerima.setGalat(dicoba && !k.penerima.trim() ? 'Wajib diisi.' : undefined); }
  async function kirim() {
    dicoba = true; perbarui(); if (proses || !k.penerima.trim()) return;
    proses = true; simpan.disabled = true; simpan.textContent = S.menyerahkan; status.replaceChildren();
    try { const g = await serahHasil(kunjunganId, { penerima_nama: k.penerima.trim(), ...(k.hubungan.trim() ? { hubungan: k.hubungan.trim() } : {}) }); if (aktif) { aktif = false; modal.tutup(); onSelesai?.(g); } }
    catch (e) { if (aktif) status.replaceChildren(peringatan(e instanceof GalatApi ? e.message : KASIR.bayar.gagal)); }
    finally { proses = false; simpan.disabled = false; simpan.textContent = S.serahkan; }
  }
  form.addEventListener('submit', e => { e.preventDefault(); void kirim(); });
  modal.isi.append(status, form); modal.aksi.append(tombol(TOMBOL.batal, modal.mintaTutup, 'sekunder'), simpan); modal.fokus();
  return { tutup() { aktif = false; modal.tutup(); } };
}
