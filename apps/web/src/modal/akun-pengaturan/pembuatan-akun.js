import { AKUN_BARU, MODAL } from '@klira/shared';
import { buatPengguna } from '../../api-klien/pengguna.js';
import { daftarIzin, daftarJenisAkun } from '../../api-klien/izin.js';
import { GalatApi } from '../../api-klien/klien.js';
import { FormPeringatan, dariIsian, isianPeringatanAwal, isianPeringatanSiap } from '../../komponen/peringatan/peringatan-izin.js';
import { bukaModalBertahap } from '../../komponen/modal-bertahap/modal-dom.js';
import { peringatan as kotak, tombol } from '../../komponen/ui/native.js';
import { token } from '../../gaya/token.js';
import { adaPerubahan, adaptorLokal, kunciDraf } from '../../util/draf.js';
import { buatDrafOtomatis } from '../../util/draf-otomatis.js';
import { batasi, langkahBermasalah } from '../../util/langkah.js';
import { penggunaSaatIni } from '../../util/konteks-pengguna.js';
import { kirimAkun } from './alur-buat-akun.js';
import { awalAkun, BIDANG_SENSITIF_AKUN, galatLangkah, hariIniLokal } from './keadaan-akun.js';
import { IsiHasilAkun, LangkahData, LangkahIzin, LangkahJenis, LangkahProfil, LangkahRingkasan } from './langkah-akun.js';
export const ALUR_PEMBUATAN_AKUN = 'pembuatan-akun';
const JUMLAH_LANGKAH = 5;
export function bukaPembuatanAkun({ onTutup, onSelesai }) {
  const { pengguna: saya } = penggunaSaatIni(), hariIni = hariIniLokal(), awal = awalAkun(), kunci = kunciDraf(ALUR_PEMBUATAN_AKUN, saya?.id), adaptor = adaptorLokal(kunci, { sensitif: BIDANG_SENSITIF_AKUN });
  let hasil = null, keadaan = awal, indeks = 0, dikunjungi = [0], tampilGalat = false, peringatan = null, isian = { ...isianPeringatanAwal }, galat = null, memproses = false, katalog = null, galatKatalog = null, drafDipulihkan = false, aktif = true, modal;
  const draf = buatDrafOtomatis({ adaptor, nilai: keadaan, awal, langkah: indeks, aktif: true });
  const pulihan = draf.keadaan.pulihan;
  if (pulihan) { keadaan = { ...awal, ...pulihan.nilai }; indeks = batasi(pulihan.langkah, JUMLAH_LANGKAH); dikunjungi = Array.from({ length: indeks + 1 }, (_, n) => n); drafDipulihkan = true; }
  function simpanDraf() { draf.perbarui({ adaptor, nilai: keadaan, awal, langkah: indeks, aktif: !hasil }); }
  function status() { modal?.perbarui({ galat: galat ?? galatKatalog ?? '', labelKirim: memproses ? AKUN_BARU.membuat : peringatan ? AKUN_BARU.buatDenganAlasan : AKUN_BARU.buat, nonaktif: memproses || !!peringatan && !isianPeringatanSiap(isian) }); }
  function segarkanIsi() {
    if (!modal) return;
    const id = document.activeElement?.id, selection = id && typeof document.activeElement.selectionStart === 'number' ? [document.activeElement.selectionStart, document.activeElement.selectionEnd] : null;
    modal.ke(indeks, { fokus: false, beritahu: false }); status();
    if (id) { const input = document.getElementById(id); input?.focus(); if (selection && input?.setSelectionRange && ['text', 'search', 'password', 'tel', 'url', 'textarea'].includes(input.type)) input.setSelectionRange(...selection); }
  }
  function ubah(p) { keadaan = { ...keadaan, ...p }; peringatan = null; isian = { ...isianPeringatanAwal }; simpanDraf(); segarkanIsi(); }
  function pindah(n) { indeks = batasi(n, JUMLAH_LANGKAH); if (!dikunjungi.includes(indeks)) dikunjungi.push(indeks); galat = null; simpanDraf(); status(); }
  const dasar = () => ({ keadaan, ubah, tampilGalat }), jenis = () => katalog?.jenis ?? [], izin = () => katalog?.izin ?? [];
  const langkah = [
    { id: 'data', judul: AKUN_BARU.langkah.data, isi: () => LangkahData(dasar()) },
    { id: 'profil', judul: AKUN_BARU.langkah.profil, isi: () => LangkahProfil(dasar()) },
    { id: 'jenis', judul: AKUN_BARU.langkah.jenis, isi: () => LangkahJenis({ ...dasar(), jenis: jenis(), hariIni, memuat: !katalog && !galatKatalog }) },
    { id: 'izin', judul: AKUN_BARU.langkah.izin, isi: () => LangkahIzin({ ...dasar(), jenis: jenis(), katalog: izin(), hariIni, memuat: !katalog && !galatKatalog }) },
    { id: 'ringkasan', judul: AKUN_BARU.langkah.ringkasan, isi() {
      const el = document.createElement('div'); el.style.display = 'contents'; el.append(LangkahRingkasan({ keadaan, jenis: jenis(), katalog: izin() }));
      if (peringatan) el.append(FormPeringatan({ peringatan, nilai: isian, idDasar: 'akun-peringatan', onUbah(v) { isian = v; status(); } })); return el;
    } },
  ].map((l, n) => ({ ...l, selesai: () => n < JUMLAH_LANGKAH - 1 && dikunjungi.includes(n) && indeks !== n && !galatLangkah(keadaan)[n] }));
  modal = bukaModalBertahap({ judul: AKUN_BARU.judul, langkah, indeksAwal: indeks, onIndeks: pindah, labelKirim: AKUN_BARU.buat, onKirim() { if (!memproses && (!peringatan || isianPeringatanSiap(isian))) void kirim(); }, onTutup: () => hasil ? onSelesai() : onTutup(), lindungiTutup: () => adaPerubahan(awal, keadaan),
    onLanjut(dari) { const g = galatLangkah(keadaan)[dari]; if (g) { tampilGalat = true; galat = g; segarkanIsi(); return false; } galat = null; return true; },
    konteks() { const el = document.createElement('div'), nama = document.createElement('div'), detail = document.createElement('div'); nama.textContent = keadaan.nama.trim() || '-'; nama.style.fontWeight = token.huruf.berat.tebal; detail.textContent = `${keadaan.username.trim() || '-'} · ${Object.keys(keadaan.penugasan).length} jenis akun · ${keadaan.izin.length} izin per akun`; Object.assign(detail.style, { fontSize: token.huruf.ukuran.kecil, color: token.warna.teksRedup }); el.append(nama, detail); return el; },
    catatan() { if (!drafDipulihkan) return null; const el = kotak('', 'biru'), teks = document.createElement('span'); Object.assign(el.style, { display: 'flex', alignItems: 'center', gap: token.jarak.md }); teks.textContent = MODAL.drafDipulihkan; teks.style.flexGrow = '1'; el.append(teks, tombol(MODAL.buangDraf, () => { draf.buang(); keadaan = awal; indeks = 0; dikunjungi = [0]; drafDipulihkan = false; simpanDraf(); modal.ke(0); status(); }, 'teks')); return el; },
  });
  async function kirim() {
    const g = galatLangkah(keadaan), masalah = langkahBermasalah(g); if (masalah >= 0) { tampilGalat = true; galat = g[masalah]; indeks = masalah; if (!dikunjungi.includes(masalah)) dikunjungi.push(masalah); modal.ke(masalah, { beritahu: false }); status(); return; }
    galat = null; memproses = true; status(); const h = await kirimAkun(keadaan, peringatan ? dariIsian(isian) : undefined, buatPengguna); if (!aktif) return; memproses = false;
    if (h.jenis === 'berhasil') { draf.hapus(); hasil = h.data; modal.hasil({ judul: AKUN_BARU.berhasilJudul, isi: IsiHasilAkun({ username: hasil.username, kataSandi: hasil.kata_sandi_awal, jumlahPeringatan: hasil.peringatan.length }), aksi: [tombol(AKUN_BARU.tombolSelesai, onSelesai)] }); }
    else if (h.jenis === 'peringatan') { peringatan = h.peringatan; segarkanIsi(); } else { galat = h.pesan; status(); }
  }
  Promise.all([daftarJenisAkun(), daftarIzin()]).then(([j, i]) => { if (aktif) { katalog = { jenis: j, izin: i }; segarkanIsi(); } }).catch(e => { if (aktif) { galatKatalog = e instanceof GalatApi ? e.message : AKUN_BARU.gagalMuatKatalog; segarkanIsi(); } });
  simpanDraf(); status(); return () => { aktif = false; draf.tutup(); modal.tutup(); };
}
