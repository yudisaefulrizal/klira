import { tautanWhatsappPublik, WEBSITE_KLINIK_BAWAAN } from '@klira/shared';
import { teksHtml as aman } from '../util/teks-html.js';

const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const bentuk = {
  klinik: '<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6Z" fill="currentColor" stroke="none"/>',
  pesan: '<path d="m4 20 1-4a8 8 0 1 1 3 3Z"/><path d="M8 8c0 4 4 7 7 7l1-2-3-1-1 1-2-2 1-1-1-3Z"/>',
  pin: '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  kalender: '<rect x="4" y="5" width="16" height="16" rx="3"/><path d="M8 3v5m8-5v5M4 11h16m-11 4h2m3 0h2"/>',
  gigi: '<path d="M12 5C4-1 2 8 6 13c1 2 0 8 3 8 2 0 1-7 3-7s1 7 3 7c3 0 2-6 3-8 4-5 2-14-6-8Z"/>',
  umum: '<path d="M5 3v6a5 5 0 0 0 10 0V3M4 3h3m6 0h3m-6 11v3a4 4 0 0 0 8 0v-3"/><circle cx="18" cy="11" r="3"/>',
  keluarga: '<circle cx="10" cy="6" r="3"/><circle cx="16" cy="13" r="2.5"/><path d="M13 10a6 6 0 0 0-9 5v5h6m3-2c-3-4 7-5 7 0v3h-7Z"/>',
  panah: '<path d="M4 12h16m-6-6 6 6-6 6"/>', menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
};
function ikon(jenis, ukuran = 24) {
  return `<svg viewBox="0 0 24 24" width="${ukuran}" height="${ukuran}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${bentuk[jenis]}</svg>`;
}
function warnaTulisan(warna) {
  const rgb = [1, 3, 5].map(i => parseInt(warna.slice(i, i + 2), 16) / 255).map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4);
  return .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2] > .18 ? '#000000' : '#ffffff';
}

export function pasangKlinikPublik(wadah, slug) {
  let data = !slug || window.__KLINIK_PUBLIK__?.slug === slug ? window.__KLINIK_PUBLIK__ ?? null : null;
  let galat = '', menu = false, poli = '', semua = false, logoRusak = false;
  let hari = new Date(Date.now() + 7 * 3600000).getUTCDay() || 7;
  let aktif = true, controller, timer, pulihkanMeta;
  const cari = selector => wadah.querySelector(selector);
  function metadata() {
    pulihkanMeta?.(); pulihkanMeta = undefined;
    if (!data) return;
    const lama = document.title;
    document.title = `${data.nama} — Layanan dan jadwal praktik`;
    let meta = document.querySelector('meta[name="description"]');
    const dibuat = !meta;
    if (!meta) { meta = document.createElement('meta'); meta.name = 'description'; document.head.append(meta); }
    const isiLama = meta.content; meta.content = data.ringkasan;
    pulihkanMeta = () => { document.title = lama; if (dibuat) meta.remove(); else meta.content = isiLama; };
  }
  function navigasi() {
    return `${data.tentang ? '<a href="#tentang">Tentang</a>' : ''}${data.layanan.length ? '<a href="#layanan">Layanan</a>' : ''}${data.jadwal.length ? '<a href="#jadwal">Jadwal</a>' : ''}${data.alamat ? '<a href="#lokasi">Lokasi</a>' : ''}`;
  }
  function kontakKlinik() {
    return tautanWhatsappPublik(data.whatsapp, data.nama) ?? (data.telepon ? `tel:${data.telepon.replace(/[^+\d]/g, '')}` : data.email ? `mailto:${data.email}` : null);
  }
  function identitas() {
    return `<span class="publik-identitas">${data.logo_url && !logoRusak ? `<img data-logo src="${aman(data.logo_url)}" alt="" width="64" height="64">` : `<span class="publik-lambang">${ikon('klinik', 38)}</span>`}<span>${aman(data.nama)}</span></span>`;
  }
  function menuSeluler(terbuka) {
    menu = terbuka;
    const tombol = cari('.publik-menu');
    if (!tombol) return;
    tombol.setAttribute('aria-label', menu ? 'Tutup menu' : 'Buka menu');
    tombol.setAttribute('aria-expanded', String(menu));
    cari('#publik-nav-mobile')?.remove();
    if (menu) {
      const kontak = kontakKlinik();
      cari('.publik-header').insertAdjacentHTML('beforeend', `<nav id="publik-nav-mobile" class="publik-batas publik-nav-mobile" aria-label="Navigasi seluler">${navigasi()}${kontak ? `<a href="${aman(kontak)}">Hubungi kami</a>` : ''}<a href="/masuk">Masuk petugas</a></nav>`);
    }
  }
  function layanan() {
    const daftar = cari('.publik-layanan');
    if (!daftar) return;
    const wa = tautanWhatsappPublik(data.whatsapp, data.nama);
    daftar.innerHTML = (semua ? data.layanan : data.layanan.slice(0, 6)).map(l => {
      const jenis = /gigi|mulut/i.test(l.nama) ? 'gigi' : /ibu|anak|kia|kb/i.test(l.nama) ? 'keluarga' : 'umum';
      const punyaJadwal = data.jadwal.some(j => j.poli_id === l.id);
      return `<article class="publik-kartu-layanan"><span class="publik-ikon-bulat">${ikon(jenis)}</span><h3>${aman(l.nama)}</h3><p>Informasi layanan dan kunjungan ${aman(l.nama.toLowerCase())} di ${aman(data.nama)}.</p>${punyaJadwal ? `<a href="#jadwal" data-poli="${aman(l.id)}">Lihat jadwal ${ikon('panah', 18)}</a>` : wa ? `<a href="${aman(tautanWhatsappPublik(data.whatsapp, data.nama, l.nama))}">Tanyakan layanan ${ikon('panah', 18)}</a>` : ''}</article>`;
    }).join('');
    const tombol = cari('[data-semua]');
    if (tombol) tombol.innerHTML = `${semua ? 'Tampilkan lebih sedikit' : 'Lihat semua layanan'} ${ikon('panah')}`;
  }
  function jadwal() {
    const daftar = cari('.publik-daftar-jadwal');
    if (!daftar) return;
    cari('.publik-jadwal-kepala select').value = poli;
    wadah.querySelectorAll('[data-hari]').forEach(tombol => tombol.setAttribute('aria-pressed', String(hari === Number(tombol.dataset.hari))));
    const terpilih = data.jadwal.filter(j => j.hari === hari && (!poli || String(j.poli_id) === poli));
    daftar.innerHTML = terpilih.length ? terpilih.map(j => `<div class="publik-baris-jadwal"><span class="publik-ikon-bulat">${ikon('umum')}</span><div><strong>${aman(j.praktisi ?? j.poli_nama)}</strong>${j.praktisi ? `<small>${aman(j.poli_nama)}</small>` : ''}</div><span class="publik-jam">${aman(j.jam_mulai)}–${aman(j.jam_selesai)}<small>WIB</small></span></div>`).join('') : '<p class="publik-jadwal-kosong">Belum ada jadwal untuk pilihan ini. Silakan pilih hari atau layanan lain.</p>';
  }
  function peringatan() {
    cari('.publik-peringatan')?.remove();
    if (galat && data) cari('#konten-publik').insertAdjacentHTML('afterbegin', '<div class="publik-batas publik-peringatan" role="status">Informasi terakhir ditampilkan. <button data-perbarui>Perbarui halaman</button></div>');
  }
  function tampilkan() {
    if (!data) {
      wadah.innerHTML = `<main class="halaman-publik publik-status">${ikon('klinik', 48)}<h1>${aman(galat || 'Memuat halaman klinik…')}</h1>${galat ? '<button class="publik-tombol" data-coba>Coba lagi</button>' : ''}<a href="/masuk">Masuk petugas</a></main>`;
      return;
    }
    const wa = tautanWhatsappPublik(data.whatsapp, data.nama), kontak = kontakKlinik();
    const adaJadwal = data.jadwal.length > 0, adaKontak = !!(kontak || data.alamat || data.jam_operasional);
    const peta = data.alamat ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${data.nama}, ${data.alamat}`)}` : null;
    wadah.innerHTML = `<div class="halaman-publik">
      <a class="publik-lewati" href="#konten-publik">Lewati navigasi</a>
      <header class="publik-header"><div class="publik-batas publik-nav"><a class="publik-logo" href="${slug ? `/klinik/${aman(data.slug)}` : '/'}" aria-label="Beranda ${aman(data.nama)}">${identitas()}</a><nav aria-label="Navigasi utama" class="publik-nav-desktop">${navigasi()}</nav>${kontak ? `<a class="publik-tombol publik-outline publik-kontak-header" href="${aman(kontak)}">Hubungi kami</a>` : ''}<a class="publik-login" href="/masuk" aria-label="Masuk petugas"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h5v16h-5M3 12h12m-4-4 4 4-4 4"/></svg><span class="publik-login-desktop">Masuk petugas</span><span class="publik-login-mobile">Masuk</span></a><button class="publik-menu" aria-label="Buka menu" aria-expanded="false" aria-controls="publik-nav-mobile">${ikon('menu')}</button></div></header>
      <main id="konten-publik" tabindex="-1">
        <section class="publik-hero"><div class="publik-batas publik-hero-grid"><div class="publik-hero-isi"><p class="publik-eyebrow">${aman(data.nama)}</p><h1>${aman(data.judul)}</h1>${data.ringkasan ? `<p class="publik-ringkasan">${aman(data.ringkasan)}</p>` : ''}<div class="publik-aksi">${kontak ? `<a class="publik-tombol" href="${aman(kontak)}">${ikon('pesan')}Hubungi klinik</a>` : data.layanan.length ? `<a class="publik-tombol" href="#layanan">Lihat layanan ${ikon('panah')}</a>` : ''}${adaJadwal ? '<a class="publik-tombol publik-outline" href="#jadwal">Lihat jadwal</a>' : ''}</div></div><div class="publik-hero-gambar"><img src="${aman(data.hero_url || WEBSITE_KLINIK_BAWAAN.hero_url)}" alt="${aman(data.hero_url === WEBSITE_KLINIK_BAWAAN.hero_url ? 'Ilustrasi dokter dan pasien berhijab tanpa detail wajah dalam suasana konsultasi yang hangat' : `Gambaran layanan ${data.nama}`)}" width="1536" height="1024" fetchpriority="high"><span class="publik-label-gambar">Melayani dengan perhatian</span></div></div></section>
        ${data.alamat || adaJadwal || kontak ? `<div class="publik-batas publik-informasi">${data.alamat ? `<a href="#lokasi"><span class="publik-ikon-bulat">${ikon('pin')}</span><span><strong>Kunjungi klinik</strong><small>${aman(data.alamat)}</small></span></a>` : ''}${adaJadwal ? `<a href="#jadwal"><span class="publik-ikon-bulat">${ikon('kalender')}</span><span><strong>Rencanakan kunjungan</strong><small>Lihat jadwal praktik</small></span></a>` : ''}${kontak ? `<a href="${aman(kontak)}"><span class="publik-ikon-bulat">${ikon('pesan')}</span><span><strong>Ada pertanyaan?</strong><small>${wa ? 'Hubungi melalui WhatsApp' : 'Hubungi klinik'}</small></span></a>` : ''}</div>` : ''}
        ${data.tentang ? `<section id="tentang" class="publik-batas publik-tentang publik-bagian"><p class="publik-eyebrow">Mengenal klinik</p><h2>${aman(data.nama)}</h2><p>${aman(data.tentang)}</p></section>` : ''}
        ${data.layanan.length ? `<section id="layanan" class="publik-batas publik-bagian"><div class="publik-judul-bagian"><div><p class="publik-eyebrow">Layanan kami</p><h2>Temukan layanan yang Anda butuhkan</h2></div>${data.layanan.length > 6 ? `<button class="publik-tautan" data-semua>Lihat semua layanan ${ikon('panah')}</button>` : ''}</div><div class="publik-layanan" data-jumlah="${Math.min(data.layanan.length, 3)}"></div></section>` : ''}
        ${adaJadwal ? `<section id="jadwal" class="publik-jadwal"><div class="publik-batas publik-jadwal-grid"><div><p class="publik-eyebrow">Jadwal layanan</p><h2>Atur waktu kunjungan Anda.</h2><p>Lihat jadwal praktik sesuai layanan yang Anda pilih.</p>${wa ? `<a class="publik-tautan" href="${aman(wa)}">Tanyakan jadwal melalui WhatsApp ${ikon('panah', 18)}</a>` : ''}</div><div class="publik-panel-jadwal"><div class="publik-jadwal-kepala"><h3>Jadwal praktik</h3><label><span class="publik-sr">Pilih layanan</span><select><option value="">Semua layanan</option>${data.layanan.filter(l => data.jadwal.some(j => j.poli_id === l.id)).map(l => `<option value="${aman(l.id)}">${aman(l.nama)}</option>`).join('')}</select></label></div><div class="publik-hari" role="group" aria-label="Hari praktik">${HARI.map((h, i) => `<button data-hari="${i + 1}" aria-label="${h}" aria-pressed="${hari === i + 1}">${h.slice(0, 3)}</button>`).join('')}</div><div class="publik-daftar-jadwal" aria-live="polite"></div><p class="publik-catatan">Konfirmasi jadwal sebelum berkunjung.</p></div></div></section>` : ''}
        ${adaKontak ? `<section id="lokasi" class="publik-batas publik-bagian"><p class="publik-eyebrow">${data.alamat ? 'Lokasi kami' : 'Informasi kunjungan'}</p><h2>${data.alamat ? 'Kami dekat dengan Anda.' : 'Hubungi klinik untuk kunjungan Anda.'}</h2><div class="publik-lokasi ${!data.alamat ? 'publik-tanpa-peta' : ''}">${data.alamat ? `<iframe title="Peta lokasi ${aman(data.nama)}" src="https://maps.google.com/maps?q=${encodeURIComponent(`${data.nama} ${data.alamat}`)}&amp;output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>` : ''}<div class="publik-kontak"><h3>${aman(data.nama)}</h3>${data.alamat ? `<address>${aman(data.alamat)}</address>` : ''}${data.jam_operasional ? `<div class="publik-jam-operasional"><strong>Jam operasional</strong><p>${aman(data.jam_operasional)}</p></div>` : ''}${data.telepon ? `<a href="tel:${aman(data.telepon.replace(/[^+\d]/g, ''))}">${aman(data.telepon)}</a>` : ''}${data.email ? `<a href="mailto:${aman(data.email)}">${aman(data.email)}</a>` : ''}<div class="publik-aksi">${peta ? `<a class="publik-tombol" href="${aman(peta)}" target="_blank" rel="noopener noreferrer">${ikon('pin')}Petunjuk arah</a>` : ''}${kontak ? `<a class="publik-tombol publik-outline" href="${aman(kontak)}">${ikon('pesan')}Hubungi klinik</a>` : ''}</div><p class="publik-catatan">Konfirmasi jadwal sebelum berkunjung.</p></div></div></section>` : ''}
      </main>
      <footer class="publik-footer"><div class="publik-batas"><div class="publik-footer-atas"><div>${identitas()}<p>${aman(data.ringkasan)}</p></div><div><strong>Informasi</strong>${navigasi()}</div><div><strong>Tautan</strong><a href="/kebijakan-privasi/">Kebijakan privasi</a><a href="/ketentuan-layanan/">Ketentuan layanan</a><a href="/masuk">Masuk petugas</a></div></div><div class="publik-footer-bawah"><small>© ${new Date().getFullYear()} ${aman(data.nama)}. Semua hak dilindungi.</small><span class="publik-brand-platform">Didukung oleh <span class="logo-klira logo-klira-monokrom" style="--logo-klira-lebar:132px" role="img" aria-label="Klira"></span></span></div></div></footer>
    </div>`;
    cari('.halaman-publik').style.setProperty('--publik-utama', data.warna_utama);
    cari('.halaman-publik').style.setProperty('--publik-di-utama', warnaTulisan(data.warna_utama));
    menuSeluler(menu); layanan(); jadwal(); peringatan();
    wadah.querySelectorAll('[data-logo]').forEach(img => img.addEventListener('error', () => {
      logoRusak = true;
      wadah.querySelectorAll('[data-logo]').forEach(logo => {
        const lambang = document.createElement('span'); lambang.className = 'publik-lambang'; lambang.innerHTML = ikon('klinik', 38); logo.replaceWith(lambang);
      });
    }, { once: true }));
    cari('.publik-hero-gambar img').addEventListener('error', e => {
      const img = e.currentTarget;
      if (!img.dataset.fallback) { img.dataset.fallback = '1'; img.src = WEBSITE_KLINIK_BAWAAN.hero_url; }
    });
  }
  async function muat() {
    controller?.abort(); clearTimeout(timer);
    const permintaan = new AbortController(); controller = permintaan;
    timer = setTimeout(() => permintaan.abort(), 10000);
    const batas = timer;
    try {
      const res = await fetch(`/api/publik/klinik${slug ? `/${encodeURIComponent(slug)}` : ''}`, { signal: permintaan.signal, credentials: 'omit', cache: 'no-store' });
      const isi = await res.json();
      if (!aktif || permintaan !== controller) return;
      if (res.status === 404) { data = null; metadata(); }
      if (!res.ok) throw new Error(res.status === 404 ? 'Halaman klinik belum tersedia.' : 'Halaman belum dapat dimuat. Silakan coba kembali.');
      data = isi.data; galat = ''; metadata(); tampilkan();
    } catch (e) {
      if (aktif && permintaan === controller) {
        galat = e instanceof Error && e.name !== 'AbortError' ? e.message : 'Koneksi belum tersedia. Silakan coba kembali.';
        if (data) peringatan(); else tampilkan();
      }
    } finally { clearTimeout(batas); }
  }
  function klik(e) {
    if (!(e.target instanceof Element)) return;
    if (e.target.closest('.publik-menu')) menuSeluler(!menu);
    else if (e.target.closest('[data-coba]')) { galat = ''; tampilkan(); void muat(); }
    else if (e.target.closest('[data-perbarui]')) void muat();
    else if (e.target.closest('[data-semua]')) { semua = !semua; layanan(); }
    else if (e.target.closest('[data-hari]')) { hari = Number(e.target.closest('[data-hari]').dataset.hari); jadwal(); }
    else if (e.target.closest('[data-poli]')) {
      poli = e.target.closest('[data-poli]').dataset.poli;
      hari = data.jadwal.find(j => String(j.poli_id) === poli).hari; jadwal();
    }
    if (e.target.closest('a[href^="#"]')) menuSeluler(false);
  }
  function ubah(e) { if (e.target.matches('.publik-jadwal-kepala select')) { poli = e.target.value; jadwal(); } }
  function tombol(e) { if (menu && e.key === 'Escape') menuSeluler(false); }
  wadah.addEventListener('click', klik); wadah.addEventListener('change', ubah); window.addEventListener('keydown', tombol);
  metadata(); tampilkan(); void muat();
  return () => {
    aktif = false; controller?.abort(); clearTimeout(timer); pulihkanMeta?.();
    wadah.removeEventListener('click', klik); wadah.removeEventListener('change', ubah); window.removeEventListener('keydown', tombol);
    wadah.replaceChildren();
  };
}
