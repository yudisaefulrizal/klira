import { KASIR } from '@klira/shared';
import { ubahHargaItem } from '../../api-klien/kasir.js';
import { GalatApi } from '../../api-klien/klien.js';
import { token } from '../../gaya/token.js';
import { bukaModal1 } from '../../komponen/modal-1/modal-dom.js';
import { bidang, tombol, peringatan } from '../../komponen/ui/native.js';
import { DaftarRingkasan } from '../../komponen/ui/susunan.js';
import { galatUbahHarga } from './keadaan-kasir.js';
import { rupiahAtau } from './keadaan-order-lab.js';

export function bukaUbahHarga({ kunjunganId, item, onTutup, onUbah }) {
  const U = KASIR.ubahHarga, awal = item.harga === null ? '' : String(item.harga);
  let harga = awal, alasan = '', dicoba = false, proses = false, aktif = true, tersimpan = false;
  function tutup() { aktif = false; modal.tutup(); onTutup(); }
  const modal = bukaModal1({ judul: U.judul, lebar: 'modalKecil', onTutup: tutup, lindungiTutup: () => !tersimpan && (harga !== awal || alasan.trim() !== '') });
  const status = document.createElement('div'), form = document.createElement('form'); form.noValidate = true;
  Object.assign(form.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md });
  form.append(DaftarRingkasan({ bagian: [{ judul: '', baris: [{ label: U.item, nilai: `${item.nama} x${item.jumlah}` }, { label: U.hargaSekarang, nilai: rupiahAtau(item.harga) }, ...(item.harga_acuan !== null && item.harga_acuan !== undefined && item.harga_acuan !== item.harga ? [{ label: U.hargaAcuan, nilai: rupiahAtau(item.harga_acuan) }] : [])] }] }));
  const petunjuk = document.createElement('span'); petunjuk.textContent = U.petunjuk; Object.assign(petunjuk.style, { color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }); form.append(petunjuk);
  const fHarga = bidang({ id: 'ubah-harga-nilai', label: U.hargaBaru, nilai: harga, autoComplete: 'off', ubah(v) { harga = v; tampilGalat(); } }); fHarga.kontrol.inputMode = 'numeric';
  const fAlasan = bidang({ id: 'ubah-harga-alasan', label: U.alasan, maxLength: 300, autoComplete: 'off', ubah(v) { alasan = v; tampilGalat(); } });
  for (const f of [fHarga, fAlasan]) f.kontrol.setAttribute('aria-required', 'true');
  const bantuan = document.createElement('span'); bantuan.id = 'ubah-harga-petunjuk'; bantuan.textContent = U.alasanPetunjuk; fAlasan.kontrol.setAttribute('aria-describedby', bantuan.id);
  form.append(fHarga.el, fAlasan.el, bantuan);
  const batal = tombol(U.batal, modal.mintaTutup, 'sekunder'), simpan = tombol(U.simpan, kirim);
  function tampilGalat() { const g = galatUbahHarga(harga, alasan, item.harga); fHarga.setGalat(dicoba ? g.harga : undefined); fAlasan.setGalat(dicoba ? g.alasan : undefined); }
  async function kirim() {
    dicoba = true; tampilGalat(); if (proses || Object.keys(galatUbahHarga(harga, alasan, item.harga)).length) return;
    proses = true; batal.disabled = simpan.disabled = true; simpan.textContent = U.menyimpan; status.replaceChildren();
    try { const g = await ubahHargaItem(kunjunganId, item.id, harga.trim(), alasan.trim()); if (aktif) { tersimpan = true; aktif = false; modal.tutup(); onUbah(g); } }
    catch (e) { if (aktif) { status.replaceChildren(peringatan(e instanceof GalatApi ? e.message : KASIR.bayar.gagal)); proses = false; batal.disabled = simpan.disabled = false; simpan.textContent = U.simpan; } }
  }
  form.addEventListener('submit', e => { e.preventDefault(); void kirim(); }); modal.isi.append(status, form); modal.aksi.append(batal, simpan); modal.fokus();
  return { tutup() { aktif = false; modal.tutup(); } };
}
