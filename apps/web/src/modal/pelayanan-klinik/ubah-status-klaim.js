import { aksiKlaimTersedia, KLAIM, STATUS_KLAIM, TOMBOL } from '@klira/shared';
import { GalatApi } from '../../api-klien/klien.js';
import { ubahStatusKlaim } from '../../api-klien/klaim.js';
import { token } from '../../gaya/token.js';
import { bukaModal1 } from '../../komponen/modal-1/modal-1.js';
import { bidang, tombol, lencana, peringatan } from '../../komponen/ui/primitif.js';
import { adaPerubahan } from '../../util/draf.js';
import { formatWaktu } from '../../util/penyaring-tab.js';
import { rupiah } from './keadaan-order-lab.js';
import { awalStatusKlaim, bentukStatusKlaim, galatStatusKlaim } from './keadaan-klaim.js';

export function bukaUbahStatusKlaim({ klaim, onTutup, onSelesai }) {
  const T = KLAIM.status, aksi = aksiKlaimTersedia(klaim.status);
  const awal = awalStatusKlaim(aksi.length === 1 ? aksi[0] : '', new Date(Date.now() + 7 * 3_600_000).toISOString().slice(0, 10));
  let k = { ...awal }, dicoba = false, sibuk = false, selesai = false, aktif = true;
  function tutup() { aktif = false; modal.tutup(); (selesai ? onSelesai : onTutup)(); }
  const modal = bukaModal1({ judul: T.judul, onTutup: tutup, lindungiTutup: () => !selesai && adaPerubahan(awal, k) });
  const status = document.createElement('div'), form = document.createElement('form'), detail = document.createElement('div'), pilihan = document.createElement('div'), isian = document.createElement('div'), riwayat = document.createElement('div');
  form.noValidate = true;
  for (const el of [form, detail, pilihan, isian, riwayat]) Object.assign(el.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md });
  const nama = document.createElement('strong'); nama.textContent = klaim.pasien_nama;
  detail.append(nama, `${klaim.pasien_nomor_rm}${klaim.nomor_sep ? ` · SEP ${klaim.nomor_sep}` : ''}`, lencana(STATUS_KLAIM.label(klaim.status), STATUS_KLAIM.warna(klaim.status)));
  if (klaim.sisa_hari !== null) detail.append(KLAIM.batas.sisa(klaim.sisa_hari));
  if (klaim.status === 'dikembalikan' && klaim.batas_ajukan_ulang) detail.append(peringatan(T.batasUlang(formatWaktu(klaim.batas_ajukan_ulang)), 'biru'));
  if (klaim.berita_acara) { const el = document.createElement('span'); el.style.whiteSpace = 'pre-wrap'; el.textContent = `${T.beritaAcara}: ${klaim.berita_acara}`; detail.append(el); }
  if (klaim.status === 'dibayar' && klaim.jumlah_dibayar !== null) detail.append(`${T.jumlah}: ${rupiah(klaim.jumlah_dibayar)}${klaim.dibayar_pada ? ` · ${formatWaktu(klaim.dibayar_pada)}` : ''}`);
  if (klaim.riwayat.length) {
    const h = document.createElement('strong'); h.textContent = T.riwayat; riwayat.append(h);
    for (const r of [...klaim.riwayat].reverse()) { const el = document.createElement('span'); Object.assign(el.style, { color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }); el.textContent = `${formatWaktu(r.waktu)} · ${r.dari ? `${STATUS_KLAIM.label(r.dari)} → ` : ''}${STATUS_KLAIM.label(r.ke)}${r.oleh_nama ? ` · ${r.oleh_nama}` : ''}${r.alasan ? ` · ${r.alasan}` : ''}`; riwayat.append(el); }
  }
  const kontrol = new Map();
  function tambah(namaBidang, label, jenis = 'text', maxLength) {
    const f = bidang({ id: `sk-${namaBidang}`, label, jenis, nilai: k[namaBidang], maxLength, autoComplete: 'off', ubah(nilai) { k = { ...k, [namaBidang]: nilai }; tampilGalat(); } });
    if (namaBidang === 'jumlah_dibayar') f.kontrol.inputMode = 'numeric'; kontrol.set(namaBidang, f); isian.append(f.el);
  }
  function tampilGalat() { const g = galatStatusKlaim(k); for (const [b, f] of kontrol) f.setGalat(dicoba ? g[b] : undefined); }
  function gantiIsian() {
    isian.replaceChildren(); for (const b of [...kontrol.keys()]) if (b !== 'aksi') kontrol.delete(b);
    if (k.aksi === 'dikembalikan') tambah('berita_acara', T.beritaAcara, 'textarea', 2000);
    if (k.aksi === 'ditolak') tambah('alasan', T.alasan, 'textarea', 500);
    if (k.aksi === 'dibayar') { tambah('jumlah_dibayar', T.jumlah); tambah('dibayar_pada', T.dibayarPada, 'date'); }
    tampilGalat();
  }
  if (aksi.length) {
    const f = bidang({ id: 'sk-aksi', label: T.aksi, nilai: k.aksi, opsi: [{ nilai: '', label: '...' }, ...aksi.map(a => ({ nilai: a, label: T.aksiLabel[a] }))], ubah(nilai) { k = { ...k, aksi: nilai }; gantiIsian(); } }); kontrol.set('aksi', f); pilihan.append(f.el);
  } else pilihan.append(T.tidakAda);
  const simpan = tombol(T.simpan, kirim), batal = tombol(TOMBOL.batal, modal.mintaTutup, 'sekunder');
  async function kirim() {
    dicoba = true; tampilGalat(); if (sibuk || Object.keys(galatStatusKlaim(k)).length) return;
    sibuk = true; simpan.disabled = true; simpan.textContent = T.memproses; status.replaceChildren();
    try { await ubahStatusKlaim(klaim.id, bentukStatusKlaim(k)); if (!aktif) return; selesai = true; modal.isi.replaceChildren(peringatan(T.tersimpan, 'biru')); modal.aksi.replaceChildren(tombol(TOMBOL.tutup, tutup)); modal.setLebar('modalKecil'); }
    catch (e) { if (aktif) status.replaceChildren(peringatan(e instanceof GalatApi ? e.message : T.gagal)); }
    finally { sibuk = false; simpan.disabled = false; simpan.textContent = T.simpan; }
  }
  form.addEventListener('submit', e => { e.preventDefault(); void kirim(); }); form.append(detail, pilihan, isian, riwayat); modal.isi.append(status, form); modal.aksi.append(batal); if (aksi.length) modal.aksi.append(simpan); gantiIsian(); modal.fokus();
  return { tutup: () => { aktif = false; modal.tutup(); } };
}
