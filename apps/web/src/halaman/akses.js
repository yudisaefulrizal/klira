import { GALAT, GANTI_KREDENSIAL, MASUK, gantiKredensial as skemaGanti } from '@klira/shared';
import { ambilSaya, masuk, gantiKredensial, keluar } from '../api-klien/akses.js';
import { hapusSemuaDraf } from '../util/draf/draf.js';
import { putuskanRute, RUTE_GANTI_KREDENSIAL } from '../util/sesi/penjaga-rute.js';
import { pasangTemaTampilan } from '../komponen/tampilan/tema-tampilan.js';
import { teksHtml as aman } from '../util/teks-html.js';

function bidang(id, label, type = 'text', autocomplete = 'username', fokus = false) {
  return `<div class="akses-bidang"><label for="${id}">${aman(label)}</label><input id="${id}" name="${id}" type="${type}" autocomplete="${autocomplete}"${fokus ? ' autofocus' : ''}></div>`;
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
  const isi = `<div class="akses-kartu"><form class="akses-form">
    <${ganti ? 'h1' : 'h2'}>${aman(ganti ? GANTI_KREDENSIAL.judul : MASUK.judulForm)}</${ganti ? 'h1' : 'h2'}>
    ${ganti ? `<div class="akses-peringatan akses-biru" role="alert">${aman(GANTI_KREDENSIAL.keterangan)}</div>` : ''}
    <div data-galat class="akses-peringatan" role="alert" hidden></div>
    ${ganti ? `${bidang('username-baru', GANTI_KREDENSIAL.usernameBaru, 'text', 'username', true)}${bidang('kata-sandi-lama', GANTI_KREDENSIAL.kataSandiLama, 'password', 'current-password')}${bidang('kata-sandi-baru', GANTI_KREDENSIAL.kataSandiBaru, 'password', 'new-password')}${bidang('konfirmasi', GANTI_KREDENSIAL.konfirmasi, 'password', 'new-password')}<span class="akses-petunjuk">${aman(GANTI_KREDENSIAL.petunjukKataSandi)}</span>` : `${bidang('username', MASUK.username, 'text', 'username', true)}${bidang('kata-sandi', MASUK.kataSandi, 'password', 'current-password')}`}
    <button class="akses-tombol" type="submit" disabled>${aman(ganti ? GANTI_KREDENSIAL.tombol : MASUK.tombol)}</button>
    ${ganti ? `<button class="akses-tombol akses-sekunder" type="button" data-keluar>${aman(MASUK.keluar)}</button>` : '<div class="akses-tautan"><a href="/kebijakan-privasi/">Kebijakan Privasi</a><a href="/ketentuan-layanan/">Ketentuan Layanan</a></div>'}
    </form></div>`;
  area.innerHTML = ganti ? `<div class="akses-tengah" style="min-height:100vh">${isi}</div>` : `<div class="akses-baris"><div class="akses-merek"><h1><span class="logo-klira logo-klira-asli" style="--logo-klira-lebar:260px"><img src="/asset/brand/klira.png" alt="Klira" width="2172" height="724"></span></h1><p>${aman(MASUK.keterangan)}</p></div><div class="akses-tengah">${isi}</div></div>`;
  const form = area.querySelector('form'), tombol = form.querySelector('[type="submit"]'), galat = form.querySelector('[data-galat]');
  const nilai = id => form.elements.namedItem(id).value;
  function perbarui() {
    tombol.disabled = proses || [...form.querySelectorAll('input')].some(input => !input.value);
    tombol.textContent = ganti ? proses ? GANTI_KREDENSIAL.tombolProses : GANTI_KREDENSIAL.tombol : proses ? MASUK.tombolProses : MASUK.tombol;
  }
  function tampilkanGalat(pesan) { galat.textContent = pesan ?? ''; galat.hidden = !pesan; }
  function arahkan(baru) {
    if (!aktif) return;
    const rute = putuskanRute(path, baru);
    if (rute.tipe === 'alihkan') window.location.replace(rute.ke);
  }
  function hapusDraf() { hapusSemuaDraf(typeof localStorage === 'undefined' ? null : localStorage); }
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
  form.addEventListener('input', perbarui); form.addEventListener('submit', kirim);
  form.querySelector('[data-keluar]')?.addEventListener('click', keluarAkun);
  form.querySelector('[autofocus]').focus();
  return () => {
    aktif = false; tutupTema(); form.removeEventListener('input', perbarui); form.removeEventListener('submit', kirim);
    form.querySelector('[data-keluar]')?.removeEventListener('click', keluarAkun); wadah.replaceChildren();
  };
}
