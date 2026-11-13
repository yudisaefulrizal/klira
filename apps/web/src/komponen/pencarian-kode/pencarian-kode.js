import { KLINIS, NAVIGASI, TOMBOL } from '@klira/shared';
import { token } from '../../gaya/token.js';
import { buatNilaiTertunda } from '../../util/tunda.js';
import { bidang, tombol, peringatan } from '../ui/primitif.js';
import { bukaKamusKode } from './kamus-kode.js';
import { daftarHasilKode } from './hasil-kode.js';
export function PencarianKode(props) {
  const { id, label, petunjuk, cari, onPilih, manual = false, teksManual, kamus, tambahan } = props;
  let q = '', hasil = null, hasilTambahan = [], kataHasil = null, memuat = false, galat = null, versi = 0, aktif = true, tutupKamus;
  const el = document.createElement('div'), kepala = document.createElement('div'), pencarian = document.createElement('div'), daftar = document.createElement('div');
  Object.assign(el.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.sm }); Object.assign(kepala.style, { display: 'flex', gap: token.jarak.sm, alignItems: 'flex-end', flexWrap: 'wrap' }); Object.assign(pencarian.style, { flex: '1 1 220px', minWidth: '0' }); daftar.style.display = 'contents';
  const field = bidang({ id, label, autoComplete: 'off', ubah(value) { q = value; hasil = null; tunda.ubah(q.trim()); tampil(); } }); field.kontrol.placeholder = petunjuk; pencarian.append(field.el); kepala.append(pencarian);
  const kode = bidang({ id: `${id}-kode`, label: teksManual?.kode ?? '', autoComplete: 'off', ubah: () => siapManual() }), nama = bidang({ id: `${id}-nama`, label: teksManual?.nama ?? '', autoComplete: 'off', ubah: () => siapManual() });
  const tambah = tombol(TOMBOL.tambah, () => pilih({ kode: kode.kontrol.value, nama: nama.kontrol.value }), 'sekunder');
  const manualEl = document.createElement('div'); Object.assign(manualEl.style, { display: 'grid', gridTemplateColumns: `${token.ukuran.kolomKiri} ${token.ukuran.kolomKanan}`, columnGap: token.jarak.md, rowGap: token.jarak.md }); manualEl.append(kode.el, nama.el, tambah);
  function siapManual() { tambah.disabled = !kode.kontrol.value.trim() || !nama.kontrol.value.trim(); }
  function bersihkan() { q = ''; field.kontrol.value = ''; hasil = null; hasilTambahan = []; kode.kontrol.value = nama.kontrol.value = ''; tunda.ubah(''); tampil(); }
  function pilih(k) { onPilih(k); bersihkan(); }
  if (kamus) {
    const button = tombol('', () => { tutupKamus?.(); tutupKamus = bukaKamusKode({ ...kamus, onTutup() { tutupKamus?.(); tutupKamus = undefined; }, onPilih(k) { pilih(k); tutupKamus?.(); tutupKamus = undefined; } }); }, 'sekunder');
    button.setAttribute('aria-haspopup', 'dialog'); Object.assign(button.style, { display: 'inline-flex', alignItems: 'center', gap: token.jarak.sm });
    button.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex-shrink:0"><path d="M12 5C9 3 5 3 2 4v15c3-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-7-1-10 1Z"/><path d="M12 5v15"/></svg>'; button.append(kamus.judul); kepala.append(button);
  }
  el.append(kepala, daftar);
  function judul(teks) { const strong = document.createElement('strong'); strong.textContent = teks; return strong; }
  function tampil() {
    daftar.replaceChildren(); if (galat) daftar.append(peringatan(galat));
    if (memuat) { const s = document.createElement('span'); s.textContent = NAVIGASI.memuat; s.style.color = token.warna.teksRedup; daftar.append(s); }
    const h = kataHasil === q.trim() ? hasil : null, t = h ? hasilTambahan : [];
    if (tambahan && t.length) { const group = document.createElement('div'); Object.assign(group.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.xs }); group.append(judul(tambahan.judul), daftarHasilKode(t, { label: tambahan.judul, onPilih(v) { tambahan.onPilih(v); bersihkan(); } })); daftar.append(group); }
    if (tambahan && h?.length) daftar.append(judul(tambahan.judulKamus));
    if (h?.length) daftar.append(daftarHasilKode(h, { label: KLINIS.diagnosis.hasil, onPilih: pilih, labelContoh: KLINIS.diagnosis.contoh }));
    if (h && !h.length && !t.length && !memuat) { daftar.append(peringatan(KLINIS.diagnosis.tidakAda, 'kuning')); if (manual && teksManual) { siapManual(); daftar.append(manualEl); } }
  }
  const tunda = buatNilaiTertunda(async kata => {
    const saat = ++versi; if (!kata) { hasil = galat = null; tampil(); return; } memuat = true; tampil();
    try { const [h, t] = await Promise.all([cari(kata), tambahan?.cari ? tambahan.cari(kata) : Promise.resolve([])]); if (aktif && saat === versi) { hasil = h; hasilTambahan = t; kataHasil = kata; galat = null; } }
    catch (e) { if (aktif && saat === versi) galat = e instanceof Error ? e.message : KLINIS.galat.pencarianKosong; }
    finally { if (aktif && saat === versi) { memuat = false; tampil(); } }
  }, 250);
  tampil(); el.tutup = () => { aktif = false; versi++; tunda.tutup(); tutupKamus?.(); }; return el;
}
