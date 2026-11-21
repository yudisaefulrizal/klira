import { GALAT, GANTI_KREDENSIAL, MASUK, gantiKredensial as skemaGanti } from '@klira/shared';
import { ambilSaya, masuk, gantiKredensial, keluar } from '../../api-klien/akses.js';
import { hapusSemuaDraf } from '../../util/draf/draf.js';
import { putuskanRute, RUTE_GANTI_KREDENSIAL } from '../../util/sesi/penjaga-rute.js';
import { pasangTemaTampilan } from '../../komponen/tampilan/tema-tampilan.js';
import { teksHtml as aman } from '../../util/teks-html.js';

const IKON_PENGGUNA = '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>';
const IKON_GEMBOK = '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>';
const IKON_MATA = '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>';
const IKON_MATA_CORET = '<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c6.5 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3.5 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/>';
const IKON_GALAT = '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>';
const IKON_CENTANG = '<path d="M20 6 9 17l-5-5"/>';

function ikonSvg(isi, ukuran = 16, kelas = '') {
  return `<svg${kelas ? ` class="${kelas}"` : ''} width="${ukuran}" height="${ukuran}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${isi}</svg>`;
}

function bidang(id, label, type = 'text', autocomplete = 'username', fokus = false) {
  const sandi = type === 'password';
  const ikon = sandi ? IKON_GEMBOK : IKON_PENGGUNA;
  const atributTeks = sandi ? '' : ' spellcheck="false" autocapitalize="off"';
  return `<div class="akses-bidang">
    <label for="${id}">${aman(label)}</label>
    <div class="akses-input-wadah">
      <span class="akses-input-ikon">${ikonSvg(ikon, 17)}</span>
      <input id="${id}" name="${id}" type="${type}" autocomplete="${autocomplete}"${atributTeks}${fokus ? ' autofocus' : ''}>
      ${sandi ? `<button type="button" class="akses-toggle-sandi" data-toggle-sandi aria-label="${aman(MASUK.tampilkanSandi)}" aria-pressed="false">${ikonSvg(IKON_MATA, 17)}</button>` : ''}
    </div>
  </div>`;
}

export async function pasangAkses(wadah, path) {
  let aktif = true, proses = false;
  const pengguna = await ambilSaya().catch(() => null);
  const keputusan = putuskanRute(path, pengguna);
  if (keputusan.tipe === 'alihkan') { window.location.replace(keputusan.ke); return () => {}; }
  const ganti = path === RUTE_GANTI_KREDENSIAL;
  wadah.innerHTML = `<div data-tema-akses></div><div data-form-akses></div>`;
  const tutupTema = pasangTemaTampilan(wadah.querySelector('[data-tema-akses]'), pengguna);
  const area = wadah.querySelector('[data-form-akses]');

  const logoKartu = `<div class="akses-logo-kartu${ganti ? ' akses-logo-selalu' : ''}">
    <span class="logo-klira logo-klira-asli" style="--logo-klira-lebar:120px"><img src="/asset/brand/klira.png" alt="Klira" width="2172" height="724"></span>
  </div>`;

  const isi = `<div class="akses-kartu">
    ${logoKartu}
    <form class="akses-form">
      <div class="akses-kepala">
        <${ganti ? 'h1' : 'h2'}>${aman(ganti ? GANTI_KREDENSIAL.judul : MASUK.judulForm)}</${ganti ? 'h1' : 'h2'}>
        ${!ganti ? `<p class="akses-subjudul">${aman(MASUK.subjudulForm)}</p>` : ''}
      </div>
      ${ganti ? `<div class="akses-peringatan akses-biru" role="alert">${aman(GANTI_KREDENSIAL.keterangan)}</div>` : ''}
      <div data-galat class="akses-peringatan" role="alert" hidden>
        <span class="akses-peringatan-ikon">${ikonSvg(IKON_GALAT, 17)}</span>
        <span data-galat-teks></span>
      </div>
      ${ganti
        ? `${bidang('username-baru', GANTI_KREDENSIAL.usernameBaru, 'text', 'username', true)}${bidang('kata-sandi-lama', GANTI_KREDENSIAL.kataSandiLama, 'password', 'current-password')}${bidang('kata-sandi-baru', GANTI_KREDENSIAL.kataSandiBaru, 'password', 'new-password')}${bidang('konfirmasi', GANTI_KREDENSIAL.konfirmasi, 'password', 'new-password')}<span class="akses-petunjuk">${aman(GANTI_KREDENSIAL.petunjukKataSandi)}</span>`
        : `${bidang('username', MASUK.username, 'text', 'username', true)}${bidang('kata-sandi', MASUK.kataSandi, 'password', 'current-password')}`}
      <button class="akses-tombol" type="submit" disabled>
        <span class="akses-spinner" aria-hidden="true"></span>
        <span data-tombol-teks>${aman(ganti ? GANTI_KREDENSIAL.tombol : MASUK.tombol)}</span>
      </button>
      ${ganti
        ? `<button class="akses-tombol akses-sekunder" type="button" data-keluar>${aman(MASUK.keluar)}</button>`
        : `<p class="akses-bantuan">${aman(MASUK.bantuan)}</p><div class="akses-tautan"><a href="/kebijakan-privasi/">Kebijakan Privasi</a><span aria-hidden="true">&middot;</span><a href="/ketentuan-layanan/">Ketentuan Layanan</a><span aria-hidden="true">&middot;</span><a href="/">Beranda Klinik</a></div>`}
    </form>
  </div>`;

  const sorotanHtml = MASUK.sorotan.map(item => `<li><span class="akses-sorotan-ikon">${ikonSvg(IKON_CENTANG, 15)}</span><span>${aman(item)}</span></li>`).join('');
  area.innerHTML = ganti
    ? `<div class="akses-tengah akses-tengah-penuh">${isi}</div>`
    : `<div class="akses-baris">
        <aside class="akses-merek">
          <div class="akses-merek-isi">
            <span class="akses-lencana">${aman(MASUK.lencana)}</span>
            <h1><span class="logo-klira logo-klira-asli akses-logo-merek" style="--logo-klira-lebar:220px"><img src="/asset/brand/klira.png" alt="Klira" width="2172" height="724"></span></h1>
            <p class="akses-merek-ket">${aman(MASUK.keterangan)}</p>
            <ul class="akses-sorotan">${sorotanHtml}</ul>
          </div>
        </aside>
        <main class="akses-tengah">${isi}</main>
      </div>`;

  const form = area.querySelector('form'), tombol = form.querySelector('[type="submit"]'), tombolTeks = tombol.querySelector('[data-tombol-teks]');
  const galat = form.querySelector('[data-galat]'), galatTeks = galat.querySelector('[data-galat-teks]');
  const nilai = id => form.elements.namedItem(id).value;

  function perbarui() {
    tombol.disabled = proses || [...form.querySelectorAll('input')].some(input => !input.value);
    tombol.dataset.memuat = String(proses);
    tombolTeks.textContent = ganti ? proses ? GANTI_KREDENSIAL.tombolProses : GANTI_KREDENSIAL.tombol : proses ? MASUK.tombolProses : MASUK.tombol;
  }
  function tampilkanGalat(pesan) { galatTeks.textContent = pesan ?? ''; galat.hidden = !pesan; }
  function arahkan(baru) {
    if (!aktif) return;
    const rute = putuskanRute(path, baru);
    if (rute.tipe === 'alihkan') window.location.replace(rute.ke);
  }
  function hapusDraf() { hapusSemuaDraf(typeof localStorage === 'undefined' ? null : localStorage); }
  function toggleSandi(e) {
    const btn = e.target.closest('[data-toggle-sandi]');
    if (!btn) return;
    const input = btn.parentElement.querySelector('input');
    if (!input) return;
    const terlihat = input.type === 'text';
    input.type = terlihat ? 'password' : 'text';
    btn.setAttribute('aria-pressed', String(!terlihat));
    btn.setAttribute('aria-label', terlihat ? MASUK.tampilkanSandi : MASUK.sembunyikanSandi);
    btn.innerHTML = ikonSvg(terlihat ? IKON_MATA : IKON_MATA_CORET, 17);
  }
  async function kirim(e) {
    e.preventDefault(); if (proses) return;
    tampilkanGalat(null);
    const masukan = ganti ? { username: nilai('username-baru'), kata_sandi_lama: nilai('kata-sandi-lama'), kata_sandi: nilai('kata-sandi-baru'), konfirmasi_kata_sandi: nilai('konfirmasi') } : null;
    if (ganti) {
      const cek = skemaGanti.safeParse(masukan);
      if (!cek.success) { tampilkanGalat(cek.error.issues[0]?.message ?? GALAT.tidakValid); return; }
    }
    proses = true; perbarui();
    try {
      const baru = ganti ? await gantiKredensial(masukan) : await masuk(nilai('username'), nilai('kata-sandi'));
      if (!ganti) hapusDraf();
      arahkan(baru);
    } catch (g) {
      if (aktif) { tampilkanGalat(g instanceof Error ? g.message : ganti ? GALAT.umum : MASUK.gagal); proses = false; perbarui(); }
    }
  }
  async function keluarAkun() {
    try { try { await keluar(); } finally { hapusDraf(); } arahkan(null); }
    catch (g) { if (aktif) tampilkanGalat(g instanceof Error ? g.message : GALAT.umum); }
  }
  form.addEventListener('input', perbarui);
  form.addEventListener('submit', kirim);
  form.addEventListener('click', toggleSandi);
  form.querySelector('[data-keluar]')?.addEventListener('click', keluarAkun);
  form.querySelector('[autofocus]').focus();
  return () => {
    aktif = false; tutupTema();
    form.removeEventListener('input', perbarui);
    form.removeEventListener('submit', kirim);
    form.removeEventListener('click', toggleSandi);
    form.querySelector('[data-keluar]')?.removeEventListener('click', keluarAkun);
    wadah.replaceChildren();
  };
}
