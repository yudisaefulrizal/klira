import { PENGATURAN_PCARE as P } from '@klira/shared';
import { GalatApi, pesanGalat } from '../../api-klien/klien.js';
import { aktifkanPcare, simpanKonfigurasiPcare, ujiPcare } from '../../api-klien/pcare.js';
import { bidang, kartu, lencana, peringatan, tombol } from '../../komponen/ui/primitif.js';
import { token } from '../../gaya/token.js';
import { formatWaktu } from '../../util/tab/penyaring-tab.js';
import { ujiBerhasil } from '../satusehat/keadaan-satusehat.js';
import { aksiPcare, bentukPcare, formDariPcare, galatPcare, pcareBerubah } from './keadaan-pcare.js';
import { barisFleks, kolomFleks } from '../../gaya/tata-letak.js';

const H = P.halaman;
const BIDANG = [
  ['cons_id', H.consId, 'text', 50], ['secret_key', H.secretKey, 'password', 500], ['user_key', H.userKey, 'password', 500],
  ['username', H.username, 'text', 100], ['password', H.password, 'password', 500], ['app_code', H.appCode, 'text', 20],
  ['service_name', H.namaLayanan, 'text', 50], ['base_url', H.alamat, 'text', 300],
];
const RAHASIA_TERISI = { secret_key: 'secret_key_terisi', user_key: 'user_key_terisi', password: 'password_terisi' };

/** Satu kartu konfigurasi PCare per lingkungan: isian, simpan, uji koneksi, dan jadikan aktif. `muat` memuat ulang seluruh konfigurasi. */
export function kartuPcare(env, { bolehUbah, muat }) {
  let l = null, awal = null, form = null, galat = {}, galatServer = null, dicoba = false, memproses = false, info = null;
  const el = kartu({ susun: 'md' }), judul = document.createElement('h3'), kepala = document.createElement('div'), penanda = lencana(H.aktif, 'hijau'), pesan = document.createElement('div'), hasil = document.createElement('div'), baris = document.createElement('div');
  const formulir = document.createElement('form'); formulir.noValidate = true;
  judul.textContent = H.lingkungan[env]; Object.assign(judul.style, { margin: 0, fontSize: token.huruf.ukuran.dasar, fontWeight: token.huruf.berat.tebal });
  barisFleks(kepala, 'sm', { rata: 'center' }); kepala.append(judul, penanda);
  for (const x of [formulir, pesan]) kolomFleks(x, 'sm');
  Object.assign(hasil.style, { fontSize: token.huruf.ukuran.kecil }); barisFleks(baris, 'sm', { bungkus: true });
  const kontrol = {};
  for (const [nama, label, jenis, maks] of BIDANG) {
    const f = bidang({ id: `pcare-${env}-${nama}`, label, jenis, maxLength: maks, autoComplete: jenis === 'password' ? 'new-password' : 'off', ubah(v) { if (!form) return; form[nama] = v; tampil(); } });
    kontrol[nama] = f; formulir.append(f.el);
  }
  const simpan = tombol(H.simpan), uji = tombol(H.uji, null, 'sekunder'), aktifkan = tombol(H.aktifkan, null, 'sekunder'); simpan.type = 'submit';
  baris.append(simpan, uji, aktifkan); formulir.append(baris); el.append(kepala, pesan, formulir, hasil);

  function tampil() {
    penanda.style.display = l?.aktif ? 'inline-block' : 'none'; pesan.replaceChildren(); if (galatServer) pesan.append(peringatan(galatServer)); if (info) pesan.append(peringatan(info, 'biru'));
    galat = dicoba && form && l ? galatPcare(form, l) : {};
    for (const [nama, f] of Object.entries(kontrol)) { f.setGalat(galat[nama]); f.kontrol.disabled = !bolehUbah || memproses; if (RAHASIA_TERISI[nama]) f.kontrol.placeholder = l?.[RAHASIA_TERISI[nama]] ? H.rahasiaTersimpan : ''; }
    kontrol.base_url.kontrol.placeholder = H.alamatPetunjuk(l?.base_url_efektif ?? '');
    const a = l ? aksiPcare(l, { bolehUbah }) : { simpan: false, uji: false, aktifkan: false };
    simpan.hidden = !a.simpan; uji.hidden = !a.uji; aktifkan.hidden = !a.aktifkan; for (const t of [simpan, uji, aktifkan]) t.disabled = memproses;
    hasil.style.color = l?.hasil_uji ? (ujiBerhasil(l.hasil_uji) ? token.warna.status.hijau.teks : token.warna.status.merah.teks) : token.warna.teksRedup;
    hasil.textContent = l?.hasil_uji ? `${l.hasil_uji} ${H.terakhirUji(formatWaktu(l.diuji_pada))}` : H.belumDiuji;
  }
  function terapkan(dto, { resetForm }) {
    l = dto;
    if (resetForm || !form) { awal = formDariPcare(dto); form = { ...awal }; for (const [k, f] of Object.entries(kontrol)) f.kontrol.value = form[k]; }
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
    void jalankan(() => simpanKonfigurasiPcare(bentukPcare(form)), { resetForm: true, sukses: () => H.tersimpan });
  });
  uji.addEventListener('click', () => {
    if (form && awal && pcareBerubah(awal, form)) { galatServer = H.simpanDulu; info = null; tampil(); return; }
    void jalankan(() => ujiPcare(env), { sukses: (h) => h.pesan });
  });
  aktifkan.addEventListener('click', () => void jalankan(() => aktifkanPcare(env), { sukses: () => H.diaktifkan(H.lingkungan[env]) }));
  tampil();
  return { el, terapkan };
}
