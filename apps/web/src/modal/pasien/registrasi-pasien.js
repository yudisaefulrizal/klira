import { GALAT, MODAL, REGISTRASI } from '@klira/shared';
import { ringkasStatusIhs } from '../../halaman/satusehat/keadaan-satusehat.js';
import { cekDuplikatPasien, registrasiPasien, teksGeneralConsent } from '../../api-klien/pasien.js';
import { GalatApi, pesanGalat } from '../../api-klien/klien.js';
import { token } from '../../gaya/token.js';
import { bukaModal1 } from '../../komponen/modal-1/modal-1.js';
import { tombol, peringatan } from '../../komponen/ui/primitif.js';
import { penggunaSaatIni } from '../../util/sesi/konteks-pengguna.js';
import { adaPerubahan, adaptorLokal, kunciDraf } from '../../util/draf/draf.js';
import { buatDrafOtomatis } from '../../util/draf/draf-otomatis.js';
import { awalRegistrasi, BIDANG_KUNCI_DUPLIKAT, bentukRegistrasi, bisaCariDuplikat, galatRegistrasi, isianCariDuplikat, BIDANG_SENSITIF_REGISTRASI } from './keadaan-registrasi.js';
import { FormRegistrasi, KonteksPasien } from './langkah-registrasi.js';
import { kolomFleks } from '../../gaya/tata-letak.js';
export const ALUR_REGISTRASI_PASIEN = 'registrasi-pasien';
/**
 * Registrasi pasien baru: satu formulir dua kolom (identitas, data sosial, alamat, penjamin, wali/keluarga) dengan general consent di bawahnya,
 * tanpa langkah dan tanpa ringkasan. Draf otomatis tanpa data sensitif; pencarian data ganda berjalan saat isian kunci berubah.
 */
export function bukaRegistrasiPasien({ onTutup, onSelesai, onDaftarkanKunjungan }) {
  const awal = awalRegistrasi(), adaptor = adaptorLokal(kunciDraf(ALUR_REGISTRASI_PASIEN, penggunaSaatIni().pengguna?.id), { sensitif: BIDANG_SENSITIF_REGISTRASI });
  let keadaan = { ...awal }, tampilGalat = false, galat = null, memproses = false, hasil = null, kandidat = null, mencari = false, galatCari = null, teks = null, memuatTeks = true, galatTeks = null, drafDipulihkan = false, aktif = true, timer, versi = 0, enfant;
  // Isian tambah wali yang belum ditambahkan bertahan selama formulir dilukis ulang.
  const tampungWali = { hubungan: '', nama: '', kontak: '', coba: false };
  const draf = buatDrafOtomatis({ adaptor, nilai: keadaan, awal, langkah: 0, aktif: false }); const p = draf.keadaan.pulihan; if (p) { keadaan = { ...awal, ...p.nilai, jalur_identitas: 'nik', nomor_paspor: '', nomor_kitas: '' }; drafDipulihkan = true; }
  function bersih() { aktif = false; versi++; clearTimeout(timer); enfant?.tutup?.(); draf.tutup(); modal.tutup(); }
  function tutup() { bersih(); (hasil ? onSelesai : onTutup)(); }
  const modal = bukaModal1({ lebar: 'modalBesar', judul: REGISTRASI.judul, lindungiTutup: () => !hasil && adaPerubahan(awal, keadaan), onTutup: tutup });
  const status = document.createElement('div'), wadah = document.createElement('div'), simpan = tombol(REGISTRASI.buat, () => void kirim());
  status.style.display = 'contents'; wadah.style.display = 'contents'; modal.isi.append(status, wadah); modal.aksi.append(simpan);
  function autosave() { draf.perbarui({ adaptor, nilai: keadaan, awal, langkah: 0, aktif: !hasil }); }
  function g() { return galatRegistrasi(keadaan, teks?.id ?? null, kandidat); }
  function catatan() { const el = peringatan(MODAL.drafDipulihkan, 'biru'); el.append(' ', tombol(MODAL.buangDraf, () => { draf.buang(); keadaan = awalRegistrasi(); kandidat = null; drafDipulihkan = false; cariDuplikat(); autosave(); paint(); }, 'teks')); return el; }
  function update() {
    status.replaceChildren(...(drafDipulihkan ? [catatan()] : []), ...(galat ? [peringatan(galat)] : []));
    modal.konteks.replaceChildren(KonteksPasien({ keadaan }));
    simpan.disabled = memproses; simpan.textContent = memproses ? REGISTRASI.membuat : REGISTRASI.buat;
  }
  function paint() {
    if (!aktif || hasil) return;
    const focus = document.activeElement, id = focus?.id, start = focus?.selectionStart, end = focus?.selectionEnd;
    enfant?.tutup?.();
    enfant = FormRegistrasi({ keadaan, ubah, galat: g().bidang, tampilGalat, kandidat, mencari, galatCari, onCari: cariDuplikat, teks, memuat: memuatTeks, galatMuat: galatTeks, tampung: tampungWali, onPakai(c) { draf.hapus(); bersih(); onDaftarkanKunjungan({ id: c.id, nama: c.nama, nomor_rm: c.nomor_rm }); } });
    wadah.replaceChildren(enfant); update();
    if (id) { const f = document.getElementById(id); f?.focus(); if (start != null) try { f.setSelectionRange(start, end); } catch { /* tipe isian tanpa seleksi */ } }
  }
  function cariDuplikat() { clearTimeout(timer); const saat = ++versi; kandidat = null; galatCari = null; mencari = bisaCariDuplikat(keadaan); if (!mencari) { paint(); return; } const masukan = isianCariDuplikat(keadaan); timer = setTimeout(async () => { try { const h = await cekDuplikatPasien(masukan); if (aktif && saat === versi) kandidat = h; } catch (e) { if (aktif && saat === versi) galatCari = pesanGalat(e, REGISTRASI.duplikatGagal); } finally { if (aktif && saat === versi) { mencari = false; paint(); } } }, 500); }
  function ubah(p) { keadaan = { ...keadaan, ...p }; if (BIDANG_KUNCI_DUPLIKAT.some(b => b in p)) { if (keadaan.konfirmasi_duplikat && !('konfirmasi_duplikat' in p)) keadaan = { ...keadaan, konfirmasi_duplikat: false }; cariDuplikat(); } autosave(); paint(); }
  const fokusSalah = () => wadah.querySelector('[aria-invalid="true"]')?.focus();
  async function kirim() {
    if (memproses) return;
    if (bisaCariDuplikat(keadaan) && (mencari || kandidat === null)) { galat = galatCari ?? REGISTRASI.duplikatMencari; paint(); return; }
    const masalah = g().pesan;
    if (masalah.length) { tampilGalat = true; galat = masalah[0]; paint(); fokusSalah(); return; }
    galat = null; memproses = true; update();
    try {
      const h = await registrasiPasien(bentukRegistrasi(keadaan, teks?.id ?? null)); draf.hapus(); if (!aktif) return;
      hasil = h; enfant?.tutup?.();
      const el = document.createElement('div'), pesan = document.createElement('p'), label = document.createElement('span'), rm = document.createElement('strong');
      kolomFleks(el, 'md'); pesan.textContent = REGISTRASI.berhasilPesan(h.nama); label.textContent = REGISTRASI.nomorRm; label.style.color = token.warna.teksRedup; rm.textContent = h.nomor_rm; rm.style.fontSize = token.huruf.ukuran.judul; rm.dataset.testid = 'nomor-rm-baru'; el.append(pesan, label, rm);
      const ihs = ringkasStatusIhs(h.satusehat); if (ihs) el.append(peringatan(ihs.teks, ihs.nada));
      modal.judul.textContent = REGISTRASI.berhasilJudul; modal.setLebar('modalSedang'); modal.konteks.replaceChildren(); modal.isi.replaceChildren(el);
      modal.aksi.replaceChildren(tombol(REGISTRASI.selesai, tutup, 'sekunder'), tombol(REGISTRASI.daftarkanKunjungan, () => { bersih(); onDaftarkanKunjungan({ id: h.id, nama: h.nama, nomor_rm: h.nomor_rm }); }));
    } catch (e) {
      if (aktif) { galat = pesanGalat(e, GALAT.umum); if (e instanceof GalatApi && e.status === 409) cariDuplikat(); paint(); }
    } finally { memproses = false; if (aktif && !hasil) update(); }
  }
  modal.fokus(); autosave(); cariDuplikat(); paint();
  teksGeneralConsent().then(t => { if (aktif) teks = t; }).catch(e => { if (aktif) galatTeks = pesanGalat(e, REGISTRASI.consentGagal); }).finally(() => { if (aktif) { memuatTeks = false; paint(); } });
  return { tutup: bersih };
}
