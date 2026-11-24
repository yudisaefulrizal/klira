import { ANTREAN_JKN as A } from '@klira/shared';
import { GalatApi, pesanGalat } from '../../api-klien/klien.js';
import { ambilPengaturanAntreanJkn, simpanPengaturanAntreanJkn, tarikPendaftaranJkn } from '../../api-klien/antrean-jkn.js';
import { formatWaktu } from '../../util/tab/penyaring-tab.js';
import { bidang, kartu, peringatan, tombol } from '../../komponen/ui/primitif.js';
import { token } from '../../gaya/token.js';

const H = A.halaman;
const kolom = (gap) => ({ display: 'flex', flexDirection: 'column', gap });
const subjudul = (teks) => { const h = document.createElement('h4'); h.textContent = teks; Object.assign(h.style, { margin: 0, fontSize: token.huruf.ukuran.dasar, fontWeight: token.huruf.berat.tebal }); return h; };
const redup = (teks) => { const p = document.createElement('p'); p.textContent = teks; Object.assign(p.style, { margin: 0, color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil }); return p; };

/** Bentuk kiriman dari isian layar; kode kosong berarti pemetaan dihapus. */
export const bentukAntreanJkn = (f) => ({
  aktif: f.aktif, service_name: f.service_name.trim(), user_key: f.user_key.trim() || undefined,
  poli: f.poli.map((p) => ({ jenis_poli: p.jenis_poli, kode: p.kode.trim() })),
  dokter: f.dokter.map((d) => ({ pengguna_id: d.pengguna_id, kode: d.kode.trim() })),
});

/** Bagian pengaturan antrean online BPJS (Mobile JKN) di tab PCare: pemetaan kode poli serta dokter, dan penarikan pendaftaran dari PCare. */
export function bagianAntreanJkn({ bolehUbah }) {
  const details = document.createElement('details'), ringkas = document.createElement('summary'), isi = kartu({ susun: 'md' }), pesan = document.createElement('div'), formulir = document.createElement('form');
  ringkas.textContent = H.judul; Object.assign(ringkas.style, { cursor: 'pointer', fontWeight: token.huruf.berat.sedang });
  Object.assign(isi.style, { marginTop: token.jarak.md, maxWidth: '640px' }); Object.assign(formulir.style, kolom(token.jarak.md)); Object.assign(pesan.style, kolom(token.jarak.sm)); formulir.noValidate = true;
  let hidup = true, form = null, memproses = false, galatServer = null, info = null;
  const kontrol = {}, galatPer = new Map();
  const simpan = tombol(H.simpan); simpan.type = 'submit';

  const aktif = document.createElement('input'), labelAktif = document.createElement('label'); aktif.type = 'checkbox'; aktif.id = 'antrean-jkn-aktif';
  Object.assign(labelAktif.style, { display: 'flex', alignItems: 'center', gap: token.jarak.sm, fontWeight: token.huruf.berat.sedang }); labelAktif.append(aktif, H.aktif);
  aktif.addEventListener('change', () => { if (form) form.aktif = aktif.checked; });
  for (const [nama, label, jenis, maks] of [['service_name', H.namaLayanan, 'text', 50], ['user_key', H.userKey, 'password', 500]]) {
    kontrol[nama] = bidang({ id: `antrean-jkn-${nama}`, label, jenis, maxLength: maks, autoComplete: jenis === 'password' ? 'new-password' : 'off', ubah(v) { if (form) form[nama] = v; } });
  }
  const wadahPoli = document.createElement('div'), wadahDokter = document.createElement('div');
  for (const w of [wadahPoli, wadahDokter]) Object.assign(w.style, { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: token.jarak.sm });
  const tarik = tombol(A.tarik.tombol, null, 'sekunder'), hasilTarik = redup(A.tarik.belumPernah), barisAksi = document.createElement('div'); tarik.type = 'button';
  Object.assign(barisAksi.style, { display: 'flex', gap: token.jarak.sm, flexWrap: 'wrap' }); barisAksi.append(simpan, tarik);
  formulir.append(labelAktif, kontrol.service_name.el, kontrol.user_key.el, subjudul(H.pemetaanPoli), wadahPoli, subjudul(H.pemetaanDokter), wadahDokter, barisAksi, hasilTarik);
  isi.append(redup(H.petunjuk), pesan, formulir);
  const tampilTarik = (t) => { hasilTarik.textContent = t ? [A.tarik.terakhir(formatWaktu(t.waktu), t.pesan), ...(t.dilewati ?? [])].join(' ') : A.tarik.belumPernah; hasilTarik.style.color = t?.status === 'gagal' || t?.dilewati?.length ? token.warna.status.merah.teks : token.warna.teksRedup; };
  tarik.addEventListener('click', async () => {
    if (memproses) return; memproses = true; galatServer = info = null; tampil();
    try { const t = await tarikPendaftaranJkn(true); if (hidup) tampilTarik(t); }
    catch (e) { if (hidup) galatServer = pesanGalat(e, A.tarik.gagal); }
    finally { memproses = false; if (hidup) tampil(); }
  }); details.append(ringkas, isi);

  function isiPemetaan(wadah, daftar, kunci, label, kosong) {
    wadah.replaceChildren();
    if (!daftar.length) { wadah.append(redup(kosong)); return; }
    daftar.forEach((baris, i) => {
      const f = bidang({ id: `antrean-jkn-${kunci}-${i}`, label: label(baris), nilai: baris.kode, maxLength: 20, autoComplete: 'off', ubah(v) { baris.kode = v; } });
      f.kontrol.disabled = !bolehUbah || memproses; galatPer.set(`${kunci}.${i}.kode`, f); wadah.append(f.el);
    });
  }
  function tampil() {
    pesan.replaceChildren(); if (!bolehUbah) pesan.append(peringatan('Anda hanya dapat melihat pengaturan.', 'biru')); if (galatServer) pesan.append(peringatan(galatServer)); if (info) pesan.append(peringatan(info, 'biru'));
    for (const f of Object.values(kontrol)) f.kontrol.disabled = !bolehUbah || memproses;
    aktif.disabled = !bolehUbah || memproses; simpan.hidden = !bolehUbah; simpan.disabled = memproses || !form; tarik.disabled = memproses;
  }
  function terapkan(d) {
    form = { aktif: d.aktif, service_name: d.service_name, user_key: '', poli: d.poli.map((p) => ({ ...p })), dokter: d.dokter.map((x) => ({ ...x })) };
    aktif.checked = form.aktif; for (const [nama, f] of Object.entries(kontrol)) { f.kontrol.value = form[nama]; f.setGalat(undefined); }
    kontrol.user_key.kontrol.placeholder = d.user_key_terisi ? H.rahasiaTersimpan : H.userKeyPetunjuk;
    galatPer.clear(); isiPemetaan(wadahPoli, form.poli, 'poli', (p) => H.kodePoli(p.jenis_poli), H.tanpaPoli); isiPemetaan(wadahDokter, form.dokter, 'dokter', (x) => H.kodeDokter(x.nama), H.tanpaDokter);
    tampilTarik(d.tarik_terakhir); tampil();
  }
  async function muat() {
    try { const d = await ambilPengaturanAntreanJkn(); if (hidup) terapkan(d); }
    catch (e) { if (hidup) { galatServer = pesanGalat(e, H.gagalMuat); tampil(); } }
  }
  formulir.addEventListener('submit', async (e) => {
    e.preventDefault(); if (!form || memproses) return;
    memproses = true; galatServer = info = null; tampil();
    try { const d = await simpanPengaturanAntreanJkn(bentukAntreanJkn(form)); if (!hidup) return; memproses = false; info = H.tersimpan; terapkan(d); }
    catch (galat) {
      memproses = false; galatServer = pesanGalat(galat, H.gagalSimpan); tampil();
      if (galat instanceof GalatApi) for (const r of galat.rincian ?? []) (kontrol[r.jalur] ?? galatPer.get(r.jalur))?.setGalat(r.pesan);
    }
  });
  tampil(); void muat();
  return { el: details, tutup() { hidup = false; details.replaceChildren(); } };
}
