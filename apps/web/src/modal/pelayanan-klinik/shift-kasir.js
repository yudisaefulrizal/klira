import { KASIR, TOMBOL } from '@klira/shared';
import { bukaShift, tutupShift } from '../../api-klien/kasir.js';
import { GalatApi } from '../../api-klien/klien.js';
import { token } from '../../gaya/token.js';
import { bukaModal1 } from '../../komponen/modal-1/modal-1.js';
import { bidang, tombol, peringatan } from '../../komponen/ui/primitif.js';
import { DaftarRingkasan } from '../../komponen/ui/susunan.js';
import { adaPerubahan } from '../../util/draf.js';
import { awalShift, galatBukaShift, galatTutupShift, selisihShift } from './keadaan-kasir.js';
import { rupiah } from './keadaan-order-lab.js';

export function bukaShiftKasir({ shift, onTutup, onSelesai }) {
  const S = KASIR.shift, menutup = !!shift, awal = awalShift();
  let k = { ...awal }, dicoba = false, proses = false, aktif = true;
  const modal = bukaModal1({ judul: menutup ? S.tutupJudul : S.bukaJudul, lindungiTutup: () => adaPerubahan(awal, k), onTutup() { aktif = false; modal.tutup(); onTutup(); } });
  const status = document.createElement('div'), form = document.createElement('form'), ringkas = document.createElement('div'); form.noValidate = true;
  Object.assign(form.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md });
  const petunjuk = document.createElement('span'); petunjuk.style.color = token.warna.teksRedup; petunjuk.textContent = menutup ? S.petunjukTutup(rupiah(shift.kas_seharusnya)) : S.petunjukBuka; form.append(petunjuk);
  if (menutup) form.append(DaftarRingkasan({ bagian: [{ judul: '', baris: [{ label: S.kasAwal, nilai: rupiah(shift.kas_awal) }, { label: S.tunai, nilai: rupiah(shift.tunai) }, { label: S.seharusnya, nilai: rupiah(shift.kas_seharusnya) }] }] }));
  const kas = bidang({ id: 'shift-kas', label: menutup ? S.kasAkhir : S.kasAwal, nilai: k.kas, autoComplete: 'off', ubah(v) { k = { ...k, kas: v }; perbarui(); } }); kas.kontrol.inputMode = 'numeric';
  const alasan = bidang({ id: 'shift-alasan', label: S.alasanSelisih, jenis: 'textarea', nilai: k.alasan, maxLength: 300, ubah(v) { k = { ...k, alasan: v }; perbarui(); } });
  form.append(kas.el, ringkas, alasan.el);
  const label = menutup ? S.tutupSimpan : S.bukaSimpan, simpan = tombol(label, kirim);
  function galatBidang() { return menutup ? galatTutupShift(k, shift.kas_seharusnya) : galatBukaShift(k); }
  function perbarui() {
    const g = galatBidang(), s = menutup ? selisihShift(k, shift.kas_seharusnya) : null;
    kas.setGalat(dicoba ? g.kas : undefined); alasan.setGalat(dicoba ? g.alasan : undefined);
    ringkas.replaceChildren(); if (s !== null) ringkas.append(peringatan(S.ringkasTutup(s), s === 0 ? 'biru' : 'merah'));
    alasan.el.hidden = !menutup || s === null || s === 0;
  }
  async function kirim() {
    dicoba = true; perbarui(); if (proses || Object.keys(galatBidang()).length) return;
    proses = true; simpan.disabled = true; simpan.textContent = S.menyimpan; status.replaceChildren();
    try { if (menutup) await tutupShift({ kas_akhir: k.kas, alasan_selisih: k.alasan }); else await bukaShift({ kas_awal: k.kas }); if (aktif) { aktif = false; modal.tutup(); onSelesai(); } }
    catch (e) { if (aktif) status.replaceChildren(peringatan(e instanceof GalatApi ? e.message : KASIR.bayar.gagal)); }
    finally { proses = false; simpan.disabled = false; simpan.textContent = label; }
  }
  form.addEventListener('submit', e => { e.preventDefault(); void kirim(); }); modal.isi.append(status, form); modal.aksi.append(tombol(TOMBOL.batal, modal.mintaTutup, 'sekunder'), simpan); perbarui(); modal.fokus();
  return { tutup() { aktif = false; modal.tutup(); } };
}
