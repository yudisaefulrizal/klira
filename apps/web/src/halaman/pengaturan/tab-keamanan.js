import { KEAMANAN } from '@klira/shared';
import { GalatApi } from '../../api-klien/klien.js';
import { ambilPengaturanKeamanan, simpanPengaturanKeamanan } from '../../api-klien/keamanan.js';
import { izinSaatIni } from '../../komponen/izin-saja.js';
import { bidang, kartu, tombol, peringatan } from '../../komponen/ui/primitif.js';
import { token } from '../../gaya/token.js';
import { BATAS_FORM, formDariPengaturan, bentukKeamanan, galatKeamanan, keamananBerubah } from './keadaan-keamanan.js';
export function pasangTabKeamanan(wadah) {
  const bolehUbah = izinSaatIni()('akses', 'perbaikan'); let awal = null, form = null, bawaan = false, galat = null, info = null, memproses = false, dicoba = false, aktif = true;
  const el = document.createElement('section'), card = kartu({ susun: 'md' }), judul = document.createElement('div'), ket = document.createElement('span'), pesan = document.createElement('div'), formulir = document.createElement('form'), baris = document.createElement('div');
  el.id = 'panel-keamanan'; el.setAttribute('role', 'tabpanel'); el.setAttribute('aria-labelledby', 'tab-keamanan'); Object.assign(el.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.md }); judul.textContent = KEAMANAN.kebijakanJudul; Object.assign(judul.style, { fontSize: token.huruf.ukuran.besar, fontWeight: token.huruf.berat.tebal }); ket.textContent = KEAMANAN.kebijakanPetunjuk; ket.style.color = token.warna.teksRedup; pesan.style.display = 'contents'; Object.assign(formulir.style, { display: 'none', flexDirection: 'column', gap: token.jarak.md }); Object.assign(baris.style, { display: 'flex', alignItems: 'stretch', gap: token.jarak.lg, flexWrap: 'wrap' }); formulir.append(baris); card.append(judul, ket, pesan, formulir); el.append(card); wadah.replaceChildren(el);
  const controls = new Map();
  const definisi = [
    ['masa_sesi_jam', KEAMANAN.masaSesi, BATAS_FORM.masaSesiJam, KEAMANAN.petunjukMasaSesi],
    ['batas_percobaan_masuk', KEAMANAN.batasPercobaan, BATAS_FORM.batasPercobaanMasuk, KEAMANAN.petunjukBatas],
    ['panjang_minimum_kata_sandi', KEAMANAN.panjangKataSandi, BATAS_FORM.panjangMinimumKataSandi, KEAMANAN.petunjukPanjang],
  ];
  for (const [nama, label, batas, petunjuk] of definisi) {
    const col = document.createElement('div'), hint = document.createElement('span'); Object.assign(col.style, { display: 'flex', flexDirection: 'column', gap: token.jarak.xs });
    const f = bidang({ id: `keamanan-${nama}`, label, jenis: 'number', ubah(v) { if (form) { form[nama] = v; tampil(); } } }); Object.assign(f.kontrol, { min: String(batas.min), max: String(batas.maks), step: '1', inputMode: 'numeric', readOnly: !bolehUbah }); f.kontrol.style.maxWidth = token.ukuran.kolomFilter;
    hint.textContent = petunjuk(batas.min, batas.maks); Object.assign(hint.style, { fontSize: token.huruf.ukuran.kecil, color: token.warna.teksRedup }); col.append(f.el, hint); baris.append(col); controls.set(nama, f);
  }
  const simpan = tombol(KEAMANAN.simpan); simpan.type = 'submit'; if (bolehUbah) { const div = document.createElement('div'); div.append(simpan); formulir.append(div); }
  function terapkan(p) { awal = formDariPengaturan(p); form = { ...awal }; bawaan = p.bawaan; for (const [k, f] of controls) f.kontrol.value = form[k]; }
  function tampil() { pesan.replaceChildren(); if (bawaan) pesan.append(peringatan(KEAMANAN.bawaan, 'biru')); if (galat) pesan.append(peringatan(galat)); if (info) pesan.append(peringatan(info, 'biru')); formulir.style.display = form ? 'flex' : 'none'; const g = form ? galatKeamanan(form) : {}; for (const [k, f] of controls) f.setGalat(dicoba ? g[k] : undefined); simpan.disabled = memproses || !awal || !form || !keamananBerubah(awal, form); simpan.textContent = memproses ? KEAMANAN.menyimpan : KEAMANAN.simpan; }
  formulir.addEventListener('submit', async e => {
    e.preventDefault(); dicoba = true; tampil(); if (!form || Object.keys(galatKeamanan(form)).length) return; memproses = true; galat = info = null; tampil();
    try { const p = await simpanPengaturanKeamanan(bentukKeamanan(form)); if (!aktif) return; terapkan(p); dicoba = false; info = KEAMANAN.tersimpan; }
    catch (e) { if (aktif) galat = e instanceof GalatApi ? e.message : KEAMANAN.gagalSimpan; }
    finally { if (aktif) { memproses = false; tampil(); } }
  });
  tampil(); ambilPengaturanKeamanan().then(p => { if (aktif) { terapkan(p); tampil(); } }).catch(e => { if (aktif) { galat = e instanceof GalatApi ? e.message : KEAMANAN.gagalMuat; tampil(); } });
  return { tutup() { aktif = false; wadah.replaceChildren(); } };
}
