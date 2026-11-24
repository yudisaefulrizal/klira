import { UJI_ENDPOINT as U, butuhBadan } from '@klira/shared';
import { GalatApi, pesanGalat } from '../../api-klien/klien.js';
import { ambilKonfigurasiPcare } from '../../api-klien/pcare.js';
import { ambilKatalogUji, kirimUji } from '../../api-klien/uji-endpoint.js';
import { izinSaatIni } from '../../komponen/izin/izin-saja.js';
import { bidang, kartu, lencana, peringatan, tab, tombol } from '../../komponen/ui/primitif.js';
import { token } from '../../gaya/token.js';
import { bentukKirim, formAwal, galatForm, kelompokkan, pulihkanBadan, ringkasHasil, ringkasKoneksi, ubahBadan, ubahParameter } from './keadaan-test-endpoint.js';
import { kartuPcare } from './kartu-pcare.js';
import { bagianAntreanJkn } from './kartu-antrean-jkn.js';
import { barisFleks } from '../../gaya/tata-letak.js';

const H = U.halaman;
const LAYANAN = ['satusehat', 'pcare'];
const kolom = (gap) => ({ display: 'flex', flexDirection: 'column', gap });
const teksTetap = (teks, tinggi = '320px') => {
  const pre = document.createElement('pre'); pre.textContent = teks;
  Object.assign(pre.style, { margin: 0, padding: token.jarak.sm, background: token.warna.permukaan, border: `${token.ukuran.garis} solid ${token.warna.garisHalus}`, borderRadius: token.radius.sedang, fontFamily: 'ui-monospace, Menlo, Consolas, monospace', fontSize: token.huruf.ukuran.kecil, overflow: 'auto', maxHeight: tinggi, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' });
  return pre;
};

/** Panel satu layanan: pilih endpoint dari katalog, isi parameter dan badan, kirim, lihat hasil. */
function panelLayanan(layanan, { bolehKirim }) {
  let data = null, endpoint = null, form = null, dicoba = false, mengirim = false, hasil = null, galatKirim = null, versi = 0, hidup = true;
  const el = document.createElement('div'), spanduk = document.createElement('div'), pilih = document.createElement('select'), info = document.createElement('div'), paramWadah = document.createElement('div'), badanWadah = document.createElement('div'), aksi = document.createElement('div'), pesan = document.createElement('div'), hasilWadah = document.createElement('div');
  el.id = `panel-${layanan}`; el.setAttribute('role', 'tabpanel'); el.setAttribute('aria-labelledby', `tab-${layanan}`); Object.assign(el.style, kolom(token.jarak.md));
  for (const x of [spanduk, paramWadah, badanWadah, pesan, hasilWadah]) Object.assign(x.style, kolom(token.jarak.sm));
  Object.assign(info.style, { display: 'flex', alignItems: 'center', gap: token.jarak.sm, flexWrap: 'wrap', color: token.warna.teksRedup, fontSize: token.huruf.ukuran.dasar });
  barisFleks(aksi, 'sm');
  const pilihBidang = document.createElement('div'), pilihLabel = document.createElement('label'); pilih.id = `uji-${layanan}-endpoint`; pilihLabel.htmlFor = pilih.id; pilihLabel.textContent = H.endpoint;
  Object.assign(pilihBidang.style, kolom(token.jarak.xs)); Object.assign(pilihLabel.style, { fontSize: token.huruf.ukuran.dasar, fontWeight: token.huruf.berat.sedang });
  Object.assign(pilih.style, { height: token.ukuran.isian, padding: `0 ${token.jarak.sm}`, border: `${token.ukuran.garis} solid ${token.warna.garis}`, borderRadius: token.radius.sedang, background: token.warna.permukaan, color: token.warna.teks, fontFamily: token.huruf.keluarga, fontSize: token.huruf.ukuran.dasar });
  pilihBidang.append(pilihLabel, pilih);
  const kirim = tombol(H.kirim); kirim.type = 'button'; aksi.append(kirim);
  el.append(spanduk, pilihBidang, info, paramWadah, badanWadah, aksi, pesan, hasilWadah);
  const kontrolParam = new Map(); let badanKontrol = null, pulihkan = null;

  const konteks = () => data?.konteks ?? {};
  function bangunForm() {
    kontrolParam.clear(); paramWadah.replaceChildren(); badanWadah.replaceChildren(); badanKontrol = null; dicoba = false; galatKirim = null; hasil = null; hasilWadah.replaceChildren();
    info.replaceChildren(); if (!endpoint) return;
    const metode = lencana(endpoint.metode, endpoint.metode === 'GET' ? 'biru' : endpoint.metode === 'DELETE' ? 'merah' : 'kuning'), jalur = document.createElement('code'); jalur.textContent = `${endpoint.jalur}${endpoint.paginasi ? '[/{start}/{limit}]' : ''}`; info.append(metode, jalur);
    const semua = [...endpoint.parameter.map((q) => [q.nama, q.label]), ...(endpoint.paginasi ? [['start', H.mulai], ['limit', H.jumlah]] : [])];
    if (semua.length) {
      const judul = document.createElement('strong'); judul.textContent = H.parameter; paramWadah.append(judul);
      for (const [nama, label] of semua) {
        const nilai = nama === 'start' || nama === 'limit' ? form[nama] : form.parameter[nama];
        const f = bidang({ id: `uji-${layanan}-p-${nama}`, label, nilai, autoComplete: 'off', maxLength: 300, ubah(v) { form = ubahParameter(endpoint, form, nama, v, konteks()); if (badanKontrol && !form.badanDiubah) badanKontrol.kontrol.value = form.badan; periksa(); } });
        kontrolParam.set(nama, f); paramWadah.append(f.el);
      }
    }
    if (butuhBadan(endpoint)) {
      const f = bidang({ id: `uji-${layanan}-badan`, label: H.badan, jenis: 'textarea', nilai: form.badan, autoComplete: 'off', ubah(v) { form = ubahBadan(form, v); periksa(); } });
      f.kontrol.style.height = '260px'; f.kontrol.style.fontFamily = 'ui-monospace, Menlo, Consolas, monospace'; f.kontrol.spellcheck = false; badanKontrol = f;
      pulihkan = tombol(H.pulihkanContoh, () => { form = pulihkanBadan(endpoint, form, konteks()); f.kontrol.value = form.badan; periksa(); }, 'sekunder'); pulihkan.hidden = true;
      badanWadah.append(f.el, pulihkan);
    }
    periksa();
  }
  function periksa() {
    const g = dicoba && endpoint && form ? galatForm(endpoint, form) : {};
    for (const [nama, f] of kontrolParam) f.setGalat(g[`parameter.${nama}`]);
    badanKontrol?.setGalat(g.badan); if (pulihkan) pulihkan.hidden = !form.badanDiubah;
    pesan.replaceChildren(); if (galatKirim) pesan.append(peringatan(galatKirim));
    const boleh = bolehKirim && data?.koneksi.boleh_uji && endpoint; kirim.disabled = !boleh || mengirim; kirim.textContent = mengirim ? H.mengirim : H.kirim;
  }
  function tampilHasil() {
    hasilWadah.replaceChildren(); if (!hasil) return;
    const r = ringkasHasil(layanan, hasil), judul = document.createElement('strong'), baris = document.createElement('div'); judul.textContent = H.hasilJudul;
    barisFleks(baris, 'sm', { rata: 'center', bungkus: true });
    if (r.status !== null) baris.append(lencana(String(r.status), r.nada)); if (r.durasi !== null) { const d = document.createElement('small'); d.textContent = H.durasi(r.durasi); baris.append(d); }
    hasilWadah.append(judul, baris); for (const c of r.catatan) hasilWadah.append(peringatan(c, r.nada === 'merah' ? 'merah' : 'biru'));
    const a = document.createElement('small'), b = document.createElement('small'); a.textContent = H.permintaan; b.textContent = H.respons;
    hasilWadah.append(a, teksTetap(r.permintaan, '180px')); if (r.respons) hasilWadah.append(b, teksTetap(r.respons));
  }
  pilih.addEventListener('change', () => { endpoint = data.katalog.find((x) => x.id === pilih.value) ?? null; form = endpoint ? formAwal(endpoint, konteks()) : null; bangunForm(); });
  kirim.addEventListener('click', async () => {
    if (!endpoint || mengirim) return; dicoba = true; periksa(); if (Object.keys(galatForm(endpoint, form)).length) return;
    mengirim = true; galatKirim = null; periksa(); const saat = ++versi;
    try { const h = await kirimUji(bentukKirim(layanan, endpoint, form)); if (hidup && saat === versi) { hasil = h; tampilHasil(); } }
    catch (e) { if (hidup && saat === versi) { galatKirim = pesanGalat(e, H.gagalKirim); if (e instanceof GalatApi) for (const r of e.rincian ?? []) kontrolParam.get(r.jalur.replace(/^parameter\./, ''))?.setGalat(r.pesan); } }
    finally { mengirim = false; if (hidup) periksa(); }
  });
  async function muat() {
    try {
      const h = await ambilKatalogUji(layanan); if (!hidup) return; data = h; spanduk.replaceChildren(); const k = ringkasKoneksi(data.koneksi); spanduk.append(peringatan(k.teks, k.nada));
      pilih.replaceChildren(); for (const g of kelompokkan(data.katalog)) { const og = document.createElement('optgroup'); og.label = g.kelompok; for (const x of g.isi) { const o = document.createElement('option'); o.value = x.id; o.textContent = `${x.metode} · ${x.label}`; og.append(o); } pilih.append(og); }
      endpoint = data.katalog[0] ?? null; form = endpoint ? formAwal(endpoint, konteks()) : null; bangunForm();
    } catch (e) { if (hidup) { spanduk.replaceChildren(peringatan(pesanGalat(e, H.gagalMuat))); } }
  }
  void muat();
  return { el, tutup() { hidup = false; versi++; el.replaceChildren(); } };
}

/** Bagian koneksi PCare di tab PCare: kartu per lingkungan dalam satu <details>. */
function bagianKoneksiPcare({ bolehUbah, onUbah }) {
  const details = document.createElement('details'), ringkas = document.createElement('summary'), isi = document.createElement('div'), banner = document.createElement('div');
  ringkas.textContent = H.koneksiPcare; Object.assign(ringkas.style, { cursor: 'pointer', fontWeight: token.huruf.berat.sedang }); Object.assign(isi.style, { ...kolom(token.jarak.md), marginTop: token.jarak.md, maxWidth: '640px' });
  const kartuPer = {}; let hidup = true;
  async function muat({ resetForm = true, env } = {}) {
    try {
      const d = await ambilKonfigurasiPcare(); if (!hidup) return; banner.replaceChildren(); if (!bolehUbah) banner.append(peringatan('Anda hanya dapat melihat konfigurasi.', 'biru'));
      for (const l of d.lingkungan) kartuPer[l.environment].terapkan(l, { resetForm: resetForm && (env === undefined || env === l.environment) });
      onUbah?.();
    } catch (e) { if (hidup) banner.replaceChildren(peringatan(pesanGalat(e, 'Konfigurasi PCare tidak dapat dimuat.'))); }
  }
  for (const env of ['sandbox', 'produksi']) { kartuPer[env] = kartuPcare(env, { bolehUbah, muat }); isi.append(kartuPer[env].el); }
  details.append(ringkas, banner, isi); void muat();
  return { el: details, tutup() { hidup = false; details.replaceChildren(); } };
}

export function HalamanTestEndpoint() {
  const izin = izinSaatIni(), bolehKirim = izin('satusehat', 'perbaikan');
  const el = document.createElement('div'), header = document.createElement('header'), h1 = document.createElement('h1'), petunjuk = document.createElement('p'), isi = document.createElement('div');
  el.style.display = 'contents'; Object.assign(header.style, kolom(token.jarak.sm)); Object.assign(h1.style, { margin: 0, fontSize: token.huruf.ukuran.halaman, fontWeight: token.huruf.berat.tebal });
  h1.textContent = H.judul; Object.assign(petunjuk.style, { margin: 0, color: token.warna.teksRedup }); petunjuk.textContent = H.petunjuk; Object.assign(isi.style, { ...kolom(token.jarak.md), maxWidth: '860px' });
  const tabs = tab(LAYANAN.map((id) => ({ id, label: H.layanan[id] })), '', H.judul, (id) => pilihLayanan(id)); header.append(h1, petunjuk, tabs.el); el.append(header, isi);
  const panel = new Map(), tambahan = new Map(); let aktif = null, antreanJkn = null;
  function pilihLayanan(id) {
    if (aktif === id) return; aktif = id; tabs.pilih(id); isi.replaceChildren();
    if (!panel.has(id)) panel.set(id, panelLayanan(id, { bolehKirim }));
    if (id === 'pcare' && !tambahan.has(id)) tambahan.set(id, bagianKoneksiPcare({ bolehUbah: bolehKirim }));
    if (id === 'satusehat') { const t = document.createElement('p'); t.textContent = H.koneksiSatusehat; Object.assign(t.style, { margin: 0, color: token.warna.teksRedup }); isi.append(t); }
    if (tambahan.has(id)) isi.append(tambahan.get(id).el);
    if (id === 'pcare') { antreanJkn ??= bagianAntreanJkn({ bolehUbah: bolehKirim }); isi.append(antreanJkn.el); }
    isi.append(kartuBungkus(panel.get(id).el));
  }
  const kartuBungkus = (anak) => { const k = kartu({ susun: 'md' }); k.append(anak); return k; };
  pilihLayanan('satusehat');
  el.tutup = () => { for (const p of panel.values()) p.tutup(); for (const t of tambahan.values()) t.tutup(); antreanJkn?.tutup(); el.replaceChildren(); };
  return el;
}
