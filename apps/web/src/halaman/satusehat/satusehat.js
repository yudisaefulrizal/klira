import { PENGATURAN_SATUSEHAT as S } from '@klira/shared';
import { GalatApi, pesanGalat } from '../../api-klien/klien.js';
import { aktifkanSatusehat, ambilKonfigurasiSatusehat, simpanKonfigurasiSatusehat, ujiSatusehat } from '../../api-klien/satusehat.js';
import { izinSaatIni } from '../../komponen/izin/izin-saja.js';
import { bidang, kartu, lencana, peringatan, tombol } from '../../komponen/ui/primitif.js';
import { token } from '../../gaya/token.js';
import { formatWaktu } from '../../util/tab/penyaring-tab.js';
import { aksiTersedia, bentukKonfigurasi, formDariLingkungan, galatKonfigurasi, konfigurasiBerubah, ujiBerhasil } from './keadaan-satusehat.js';
import { barisFleks, teksRedupKecil } from '../../gaya/tata-letak.js';

const H = S.halaman;
const LINGKUNGAN = ['sandbox', 'produksi'];
const kolom = (gap) => ({ display: 'flex', flexDirection: 'column', gap });

/** Satu kartu per lingkungan: isian, tombol, dan hasil uji koneksi terakhir. */
function kartuLingkungan(env, { bolehUbah, muat }) {
  let l = null, awal = null, form = null, galat = {}, galatServer = null, dicoba = false, memproses = false, info = null, organisasiAda = false;
  const el = kartu({ susun: 'md' }), judul = document.createElement('h2'), kepala = document.createElement('div'), penanda = lencana(H.aktif, 'hijau'), pesan = document.createElement('div'), hasil = document.createElement('div'), tombolBaris = document.createElement('div');
  const formulir = document.createElement('form'); formulir.noValidate = true;
  judul.textContent = H.lingkungan[env]; Object.assign(judul.style, { margin: 0, fontSize: token.huruf.ukuran.dasar, fontWeight: token.huruf.berat.tebal });
  barisFleks(kepala, 'sm', { rata: 'center' }); kepala.append(judul, penanda);
  Object.assign(formulir.style, kolom(token.jarak.md)); Object.assign(pesan.style, kolom(token.jarak.sm)); teksRedupKecil(hasil);
  barisFleks(tombolBaris, 'sm', { bungkus: true });
  const kontrol = {};
  for (const [nama, label, jenis, maks] of [['client_id', H.clientId, 'text', 200], ['client_secret', H.clientSecret, 'password', 500], ['base_url', H.alamat, 'text', 300]]) {
    const f = bidang({ id: `satusehat-${env}-${nama}`, label, jenis, maxLength: maks, autoComplete: nama === 'client_secret' ? 'new-password' : 'off', ubah(v) { if (!form) return; form[nama] = v; tampil(); } });
    kontrol[nama] = f; formulir.append(f.el);
  }
  const simpan = tombol(H.simpan), uji = tombol(H.uji, null, 'sekunder'), aktifkan = tombol(H.aktifkan, null, 'sekunder'); simpan.type = 'submit';
  tombolBaris.append(simpan, uji, aktifkan); formulir.append(tombolBaris); el.append(kepala, pesan, formulir, hasil);

  function tampil() {
    penanda.style.display = l?.aktif ? 'inline-block' : 'none';
    pesan.replaceChildren(); if (galatServer) pesan.append(peringatan(galatServer)); if (info) pesan.append(peringatan(info, 'biru'));
    galat = dicoba && form ? galatKonfigurasi(form, l?.client_secret_terisi ?? false) : {};
    for (const [nama, f] of Object.entries(kontrol)) f.setGalat(galat[nama]);
    kontrol.client_secret.kontrol.placeholder = l?.client_secret_terisi ? H.rahasiaTersimpan : '';
    kontrol.base_url.kontrol.placeholder = H.alamatPetunjuk(l?.base_url_efektif ?? '');
    for (const f of Object.values(kontrol)) f.kontrol.disabled = !bolehUbah || memproses;
    const a = l ? aksiTersedia(l, { bolehUbah, organisasiAda }) : { simpan: false, uji: false, aktifkan: false };
    simpan.hidden = !a.simpan; uji.hidden = !a.uji; aktifkan.hidden = !a.aktifkan;
    for (const t of [simpan, uji, aktifkan]) t.disabled = memproses;
    hasil.replaceChildren(); hasil.style.color = l?.hasil_uji ? (ujiBerhasil(l.hasil_uji) ? token.warna.status.hijau.teks : token.warna.status.merah.teks) : token.warna.teksRedup;
    hasil.textContent = l?.hasil_uji ? `${l.hasil_uji} ${H.terakhirUji(formatWaktu(l.diuji_pada))}` : H.belumDiuji;
  }
  function terapkan(dto, { resetForm, ada }) {
    l = dto; organisasiAda = ada;
    if (resetForm || !form) { awal = formDariLingkungan(dto); form = { ...awal }; for (const [k, f] of Object.entries(kontrol)) f.kontrol.value = form[k]; }
    tampil();
  }
  async function jalankan(kerja, { resetForm = false, sukses } = {}) {
    memproses = true; galatServer = info = null; tampil();
    try { const h = await kerja(); info = sukses?.(h) ?? null; await muat({ resetForm, env }); }
    catch (e) {
      galatServer = pesanGalat(e, H.gagalSimpan);
      if (e instanceof GalatApi) for (const r of e.rincian ?? []) kontrol[r.jalur]?.setGalat(r.pesan);
    } finally { memproses = false; tampil(); }
  }
  formulir.addEventListener('submit', (e) => {
    e.preventDefault(); dicoba = true; tampil(); if (!form || Object.keys(galat).length) return;
    void jalankan(() => simpanKonfigurasiSatusehat(bentukKonfigurasi(form)), { resetForm: true, sukses: () => H.tersimpan });
  });
  uji.addEventListener('click', () => {
    if (form && awal && konfigurasiBerubah(awal, form)) { galatServer = H.simpanDulu; info = null; tampil(); return; }
    void jalankan(() => ujiSatusehat(env), { sukses: (h) => h.pesan });
  });
  aktifkan.addEventListener('click', () => void jalankan(() => aktifkanSatusehat(env), { sukses: () => H.diaktifkan(H.lingkungan[env]) }));
  tampil();
  return { el, terapkan, tampil };
}

export function HalamanSatusehat() {
  const bolehUbah = izinSaatIni()('satusehat', 'perbaikan');
  let hidup = true, versi = 0;
  const el = document.createElement('div'), header = document.createElement('header'), h1 = document.createElement('h1'), petunjuk = document.createElement('p'), banner = document.createElement('div'), ringkas = document.createElement('div');
  el.style.display = 'contents'; Object.assign(header.style, kolom(token.jarak.sm)); Object.assign(h1.style, { margin: 0, fontSize: token.huruf.ukuran.halaman, fontWeight: token.huruf.berat.tebal });
  h1.textContent = H.judul; Object.assign(petunjuk.style, { margin: 0, color: token.warna.teksRedup }); petunjuk.textContent = H.petunjuk;
  Object.assign(banner.style, kolom(token.jarak.sm)); Object.assign(ringkas.style, { display: 'flex', gap: token.jarak.lg, flexWrap: 'wrap', color: token.warna.teksRedup, fontSize: token.huruf.ukuran.dasar });
  header.append(h1, petunjuk); el.append(header, banner);
  const isi = document.createElement('div'); Object.assign(isi.style, { ...kolom(token.jarak.md), maxWidth: '640px' }); el.append(ringkas, isi);
  let data = null;
  async function muat({ resetForm = true, env } = {}) {
    const saat = ++versi;
    try {
      const d = await ambilKonfigurasiSatusehat(); if (!hidup || saat !== versi) return;
      data = d; banner.replaceChildren();
      if (!bolehUbah) banner.append(peringatan(H.bacaSaja, 'biru'));
      if (!data.organization_id) banner.append(peringatan(H.organisasiKosong, 'kuning'));
      ringkas.replaceChildren(...[[H.organisasi, data.organization_id ?? '-'], [H.lingkunganAktif, data.aktif ? H.lingkungan[data.aktif] : H.belumAktif]].map(([k, v]) => { const x = document.createElement('span'), b = document.createElement('strong'); b.textContent = v; b.style.color = token.warna.teks; x.append(`${k}: `, b); return x; }));
      for (const l of data.lingkungan) kartuPer[l.environment].terapkan(l, { resetForm: resetForm && (env === undefined || env === l.environment), ada: Boolean(data.organization_id) });
    } catch (e) { if (hidup && saat === versi) { banner.replaceChildren(peringatan(pesanGalat(e, H.gagalMuat))); } }
  }
  const kartuPer = Object.fromEntries(LINGKUNGAN.map((env) => [env, kartuLingkungan(env, { bolehUbah, muat })]));
  for (const env of LINGKUNGAN) isi.append(kartuPer[env].el);
  void muat();
  el.tutup = () => { hidup = false; versi++; el.replaceChildren(); };
  return el;
}
