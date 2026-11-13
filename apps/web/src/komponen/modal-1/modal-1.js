import { MODAL, TOMBOL } from '@klira/shared';
import { token } from '../../gaya/token.js';
import { bukaLapisanRiwayat } from '../../util/riwayat-lapisan.js';
import { alasanSiap } from '../../util/alasan.js';
import { bukaDialog } from '../ui/buka-dialog.js';
import { tombol, bidang } from '../ui/primitif.js';

export function bukaKonfirmasi({ judul, pesan, labelYa = TOMBOL.konfirmasi, labelTidak = MODAL.batal, alasan = false, memproses = false, onYa, onTidak }) {
  const dialog = bukaDialog({ judul, onEsc: onTidak, lapis: 'konfirmasi', lebar: 'modalKecil' });
  const form = document.createElement('form'), h = document.createElement('h2'), isi = document.createElement('div'), kaki = document.createElement('div');
  Object.assign(form.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md, padding: token.jarak.lg });
  h.textContent = judul; Object.assign(h.style, { margin: '0', fontSize: token.huruf.ukuran.besar, fontWeight: token.huruf.berat.tebal }); isi.style.color = token.warna.teksRedup; isi.append(pesan);
  form.append(h, isi);
  const teks = alasan ? bidang({ id: 'alasan-konfirmasi', label: alasan.label ?? MODAL.alasanOpsional, jenis: 'textarea', ubah: () => perbarui() }) : null;
  if (teks) form.append(teks.el);
  const tidak = tombol(labelTidak, onTidak, 'sekunder'), ya = tombol(labelYa); ya.type = 'submit';
  Object.assign(kaki.style, { display: 'flex', gap: token.jarak.sm, alignItems: 'stretch', justifyContent: 'flex-end' }); kaki.append(tidak, ya); form.append(kaki); dialog.isi.append(form);
  function perbarui() { ya.disabled = memproses || !alasanSiap(teks?.kontrol.value ?? '', !!alasan && !!alasan.wajib); }
  form.addEventListener('submit', e => { e.preventDefault(); if (!ya.disabled) onYa(teks?.kontrol.value.trim() ?? ''); });
  perbarui(); dialog.fokus();
  return { ...dialog, perbarui({ memproses: baru }) { memproses = baru; perbarui(); } };
}

/** Modal satu layar native, dengan riwayat dan perlindungan isian yang belum disimpan. */
export function bukaModal1({ judul, onTutup, lindungiTutup = () => false, lebar = 'modalSedang' }) {
  let konfirmasi, ditutup = false;
  function mintaTutup() {
    if (lindungiTutup()) {
      if (!konfirmasi) konfirmasi = bukaKonfirmasi({ judul: MODAL.tutupDrafJudul, pesan: MODAL.tutupDrafPesan, labelYa: MODAL.tutupDrafYa, labelTidak: MODAL.tutupDrafTidak,
        onYa() { konfirmasi.tutup(); konfirmasi = undefined; onTutup(); }, onTidak() { konfirmasi.tutup(); konfirmasi = undefined; },
      });
      return false;
    }
    onTutup(); return true;
  }
  const dialog = bukaDialog({ judul, onEsc: mintaTutup, lebar });
  const kepala = document.createElement('header'), h = document.createElement('h2'), konteks = document.createElement('div');
  Object.assign(kepala.style, { display: 'flex', alignItems: 'center', gap: token.jarak.lg, padding: `${token.jarak.md} ${token.jarak.lg}`, background: token.warna.kepalaTabel, borderBottom: `${token.ukuran.garis} solid ${token.warna.garis}` });
  h.textContent = judul; Object.assign(h.style, { margin: '0', fontSize: token.huruf.ukuran.judul, fontWeight: token.huruf.berat.tebal });
  Object.assign(konteks.style, { flexGrow: '1', display: 'flex', alignItems: 'center', gap: token.jarak.lg, minWidth: '0' });
  const tutup = tombol('', mintaTutup, 'sekunder'); tutup.setAttribute('aria-label', MODAL.tutup); tutup.title = MODAL.tutup;
  Object.assign(tutup.style, { padding: '0', width: token.ukuran.tombol });
  tutup.innerHTML = '<svg width="16px" height="16px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg>';
  kepala.append(h, konteks, tutup);
  const isi = document.createElement('div'), aksi = document.createElement('footer');
  Object.assign(isi.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md, padding: token.jarak.lg, overflowY: 'auto' });
  Object.assign(aksi.style, { display: 'flex', gap: token.jarak.sm, padding: token.jarak.md, alignItems: 'stretch', justifyContent: 'flex-end', borderTop: `${token.ukuran.garis} solid ${token.warna.garis}` });
  dialog.isi.append(kepala, isi, aksi);
  const lepasRiwayat = bukaLapisanRiwayat(window, mintaTutup);
  return { isi, aksi, konteks, judul: h, mintaTutup, fokus: dialog.fokus,
    setLebar(nilai) { dialog.isi.style.width = token.ukuran[nilai]; },
    tutup() { if (ditutup) return; ditutup = true; konfirmasi?.tutup(); lepasRiwayat(); dialog.tutup(); },
  };
}
