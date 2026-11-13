import { buatSuaraPanggilan } from '../../util/panggilan/suara-panggilan.js';
import { sambungkanLayarPanggilan } from '../../util/panggilan/sambungan-layar-panggilan.js';
import { teksHtml as aman } from '../../util/teks-html.js';

const zona = 'Asia/Jakarta';
const lambang = '<svg width="52" height="52" viewBox="0 0 24 24" fill="currentColor" role="img" aria-label="Klinik"><path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6Z"></path></svg>';

export function pasangLayarPanggilan(wadah) {
  let data = null, galat = '', mode = 'menghubungkan', logo;
  const judulLama = document.title;
  document.title = 'Layar Panggilan';
  const id = window.location.pathname.split('/')[2] ?? new URLSearchParams(window.location.search).get('fasyankes');
  const sah = !!id && /^\d+$/.test(id) && Number.isSafeInteger(Number(id)) && Number(id) > 0;
  wadah.innerHTML = `<main class="layar-panggilan">
    <header class="lp-kepala"><div class="lp-merek">${lambang}</div><div class="lp-judul"><h1>Layar Panggilan</h1><p>Layar panggilan · Antrean pelayanan</p></div><div class="lp-waktu"><span></span><time></time></div></header>
    ${!sah ? '<section class="lp-petunjuk"><h2>Pilih fasilitas untuk menampilkan antrean</h2><p>Buka alamat layar panggilan dengan ID fasilitas Anda: <code>/layar-panggilan/ID-fasilitas</code></p></section>' : `<div class="lp-isi"><section class="lp-utama">
      <div class="lp-panggilan" aria-live="polite" aria-atomic="true"><div class="lp-label"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M11 4 5 9H2v6h3l6 5V4Z" fill="currentColor"></path><path d="M15 8c3 2 3 6 0 8m3-11c5 4 5 10 0 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path></svg><span>NOMOR ANTREAN DIPANGGIL</span></div><strong class="lp-nomor">—</strong><div class="lp-tujuan"><p></p><h2></h2><span class="lp-status"></span></div></div>
      <div class="lp-dokumen"><span aria-hidden="true">▤</span> Siapkan kartu berobat dan dokumen Anda</div></section>
      <section class="lp-layanan"><h2>Pelayanan saat ini</h2><div class="lp-daftar"></div><div class="lp-berikut"><h2>Antrean berikutnya</h2><div class="lp-ubin"></div></div></section></div>`}
    <footer class="lp-kaki">${sah ? '<button type="button" class="lp-tombol-suara"></button>' : ''}<p><span class="lp-info" aria-hidden="true">i</span>Mohon menunggu hingga nomor antrean Anda dipanggil.</p><span class="lp-koneksi" role="status"><i></i><span></span></span></footer>
    <div class="lp-pesan-suara" style="display:contents"></div><div class="lp-pesan-koneksi" style="display:contents"></div></main>`;
  const elemen = selector => wadah.querySelector(selector);
  const suara = buatSuaraPanggilan(sah ? id : undefined, perbaruiSuara);
  function perbaruiSuara(status) {
    const tombol = elemen('.lp-tombol-suara');
    if (tombol) {
      tombol.disabled = !status.didukung;
      tombol.setAttribute('aria-pressed', String(status.aktif));
      tombol.textContent = !status.didukung ? 'Suara tidak didukung' : status.aktif ? status.siap ? 'Suara aktif · Nonaktifkan' : 'Menyiapkan suara…' : status.perluInteraksi ? 'Aktifkan suara · ketuk sekali' : 'Aktifkan suara';
    }
    elemen('.lp-pesan-suara').innerHTML = status.galatSuara ? `<div class="lp-galat" role="alert">${aman(status.galatSuara)}</div>` : '';
  }
  elemen('.lp-tombol-suara')?.addEventListener('click', suara.ubahSuara);
  perbaruiSuara(suara.status);
  function hariIni(sekarang) {
    return new Intl.DateTimeFormat('en-CA', { timeZone: zona, year: 'numeric', month: '2-digit', day: '2-digit' }).format(sekarang);
  }
  let tanggal;
  function jam() {
    const sekarang = new Date();
    elemen('.lp-waktu span').textContent = sekarang.toLocaleDateString('id-ID', { timeZone: zona, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    elemen('.lp-waktu time').textContent = sekarang.toLocaleTimeString('id-ID', { timeZone: zona, hour: '2-digit', minute: '2-digit', hour12: false }).replace('.', ':');
    const baru = hariIni(sekarang);
    if (baru !== tanggal) { tanggal = baru; perbarui(); }
  }
  function perbarui() {
    if (data?.fasyankes_nama) document.title = `Layar Panggilan · ${data.fasyankes_nama}`;
    elemen('.lp-judul h1').textContent = data?.fasyankes_nama ?? 'Layar Panggilan';
    if (logo !== data?.fasyankes_logo_url) {
      logo = data?.fasyankes_logo_url;
      const merek = elemen('.lp-merek');
      merek.innerHTML = lambang;
      if (logo) {
        const img = document.createElement('img');
        img.src = logo; img.alt = `Logo ${data.fasyankes_nama}`; img.width = img.height = 88;
        img.addEventListener('error', () => { merek.innerHTML = lambang; }, { once: true });
        merek.replaceChildren(img);
      }
    }
    const tampilan = data?.tanggal === tanggal ? data : null;
    const panggilan = tampilan?.panggilan;
    if (sah) {
      // Jumlah poli menentukan pembagian tinggi layar (daftar pelayanan dan ubin antrean berikutnya).
      const n = Math.max(1, tampilan?.poli.length ?? 1);
      elemen('.lp-isi').style.setProperty('--n', String(n));
      elemen('.lp-isi').style.setProperty('--r', String(Math.ceil(n / 3)));
      elemen('.lp-nomor').textContent = panggilan?.kode ?? '—';
      elemen('.lp-tujuan p').textContent = panggilan ? 'Silakan menuju' : !data && !galat ? 'Memuat antrean…' : 'Silakan menunggu';
      elemen('.lp-tujuan h2').textContent = panggilan?.poli_nama ?? 'Belum ada panggilan';
      elemen('.lp-status').textContent = galat ? 'Data belum diperbarui' : panggilan ? 'Panggilan berlangsung' : 'Antrean akan tampil di sini';
      elemen('.lp-daftar').innerHTML = tampilan?.poli.length ? tampilan.poli.map(p => `<div class="lp-poli"><span class="lp-titik ${p.sekarang ? '' : 'lp-diam'}"></span><div><h3>${aman(p.nama)}</h3><p>${p.sekarang?.status === 'dipanggil' ? 'Sedang dipanggil' : p.sekarang ? 'Sedang dilayani' : 'Menunggu panggilan'}</p></div><strong>${aman(p.sekarang?.kode ?? '—')}</strong></div>`).join('') : `<p class="lp-kosong">${!data && !galat ? 'Memuat pelayanan…' : 'Belum ada pelayanan aktif.'}</p>`;
      elemen('.lp-ubin').innerHTML = tampilan?.poli.map(p => `<div><strong>${aman(p.berikutnya ?? '—')}</strong><span>${aman(p.nama)}</span></div>`).join('') ?? '';
    }
    elemen('.lp-koneksi').classList.toggle('lp-gagal', !!galat || !sah);
    elemen('.lp-koneksi > span').textContent = !sah ? 'Fasilitas belum dipilih' : galat ? 'Menghubungkan kembali' : data ? mode === 'websocket' ? 'Terhubung langsung' : mode === 'polling' ? 'Terhubung · Mode cadangan' : 'Menghubungkan langsung…' : 'Menghubungkan…';
    elemen('.lp-pesan-koneksi').innerHTML = galat ? `<div class="lp-galat" role="alert">${aman(galat)} ${data ? 'Informasi yang ditampilkan adalah data terakhir.' : ''}</div>` : '';
    suara.perbarui(data, tanggal);
  }
  jam();
  const timer = window.setInterval(jam, 1000);
  const putus = sah ? sambungkanLayarPanggilan(id, {
    asal: window.location.origin,
    mode(baru) { mode = baru; perbarui(); },
    galat(baru) { galat = baru; perbarui(); },
    data(baru) {
      data = { ...baru, event_panggilan: [...(data?.tanggal === baru.tanggal ? data.event_panggilan : []), ...baru.event_panggilan] };
      perbarui();
    },
  }) : undefined;
  return () => { clearInterval(timer); putus?.(); suara.tutup(); document.title = judulLama; wadah.replaceChildren(); };
}
