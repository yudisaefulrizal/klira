import { tanggalWib } from '@klira/shared';
import { panggilApi } from '../api-klien/klien.js';
import { grafikPenumpukan } from './statistik/grafik-penumpukan.js';
import { teksHtml as aman } from '../util/teks-html.js';
const angka = n => n === null ? '—' : new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 }).format(n);
const durasi = n => n === null ? 'Belum tersedia' : `${angka(n)} menit`;

export function pasangStatistik(wadah) {
  const hariIni = tanggalWib(new Date());
  let dari = hariIni, sampai = hariIni, poli = '', pilih = '', data = null, galat = '', memuat = true;
  let aktif = true, versi = 0, timer;
  wadah.innerHTML = `<div class="statistik"><header class="stat-kepala"><div><h1>Analisis Alur Pelayanan</h1><p>Temukan hambatan pada setiap tahap pelayanan rawat jalan.</p></div><button data-perbarui disabled>Memuat…</button></header><section class="stat-filter" aria-label="Filter statistik"><label>Dari<input aria-label="Dari" type="date" name="dari"></label><label>Sampai<input aria-label="Sampai" type="date" name="sampai"></label><label>Poli<select aria-label="Poli" name="poli"><option value="">Semua poli</option></select></label><button data-rentang="1">Hari ini</button><button data-rentang="7">7 hari</button><button data-rentang="30">30 hari</button></section><div data-pesan style="display:contents"></div><div data-statistik style="display:contents"></div></div>`;
  const cari = selector => wadah.querySelector(selector);
  function filter() {
    const awal = cari('[name=dari]'), akhir = cari('[name=sampai]');
    awal.value = dari; awal.max = sampai; akhir.value = sampai; akhir.min = dari; akhir.max = hariIni;
  }
  function status() {
    const tombol = cari('[data-perbarui]'); tombol.disabled = memuat; tombol.textContent = memuat ? 'Memuat…' : 'Perbarui';
    cari('[data-pesan]').innerHTML = `${galat ? `<div role="alert" class="stat-perhatian">${aman(galat)} <button data-perbarui>Coba lagi</button></div>` : ''}${!data && memuat ? '<p role="status">Memuat statistik pelayanan…</p>' : ''}`;
  }
  function tindakLanjut() {
    if (!data) return;
    const daftar = data.terlambat.filter(t => !pilih || data.tahap.find(s => s.kode === pilih)?.nama === t.tahap).slice(0, 20);
    cari('[data-tindak-keterangan]').textContent = `Maksimal 20 durasi tahap terlama yang melewati target acuan, ${pilih ? 'pada tahap terpilih' : 'seluruh tahap'}.`;
    cari('[data-tindak-isi]').innerHTML = daftar.length ? daftar.map(r => `<tr><td>${aman(r.nomor)}</td><td>${aman(r.poli)}</td><td>${aman(r.tahap)}</td><td>${aman(r.menit)} menit</td><td>${aman(r.target)} menit</td><td><span class="stat-label waspada">Melewati target</span></td></tr>`).join('') : '<tr><td colspan="6">Belum ada pasien melewati target dari data yang tercatat.</td></tr>';
    wadah.querySelectorAll('[data-pilih]').forEach(t => t.setAttribute('aria-pressed', String(t.dataset.pilih === pilih)));
    wadah.querySelectorAll('[data-kartu]').forEach(t => t.classList.toggle('stat-terpilih', t.dataset.kartu === pilih));
  }
  function tampilkan() {
    const isi = cari('[data-statistik]');
    if (!data) { isi.replaceChildren(); return; }
    const bukaAngka = !!isi.querySelector('details')?.open;
    const fokusTahap = isi.contains(document.activeElement) ? document.activeElement?.dataset.pilih : undefined;
    const fokusAngka = isi.contains(document.activeElement) && document.activeElement?.tagName === 'SUMMARY';
    const sorot = data.tahap.filter(t => t.perhatian);
    const maksMedian = Math.max(60, ...data.tahap.map(t => t.median ?? 0));
    isi.innerHTML = `<div class="stat-ringkasan"><article><span>Kunjungan dalam periode</span><strong>${angka(data.total)}</strong></article><article><span>Pasien unik dalam periode</span><strong>${angka(data.pasien_unik)}</strong></article><article><span>Pasien dalam proses saat ini</span><strong>${angka(data.tahap.reduce((n, t) => n + t.aktif, 0))}</strong></article><article><span>Tahap perlu perhatian</span><strong>${sorot.length}</strong></article></div>
      <div class="${sorot.length ? 'stat-perhatian' : 'stat-info'}" role="status">${sorot.length ? `<strong>Perlu perhatian: ${aman(sorot.map(t => t.nama).join(', '))}</strong><p>Durasi melebihi target acuan atau pasien masuk lebih banyak daripada selesai dalam 60 menit terakhir.</p>` : '<strong>Belum ada indikasi hambatan dari data yang tercatat.</strong><p>Perhatikan cakupan pencatatan dan jumlah sampel sebelum menyimpulkan kelancaran layanan.</p>'}</div>
      <div class="stat-subjudul"><h2>Alur pasien saat ini</h2><span>Diperbarui ${aman(new Date(data.diperbarui).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' }))} WIB · otomatis setiap menit</span></div>
      <div class="stat-chip"><button data-pilih="">Semua tahap</button>${data.tahap.map(t => `<button data-pilih="${aman(t.kode)}">${aman(t.nama)} · ${aman(t.aktif)}</button>`).join('')}</div>
      <div class="stat-alur">${data.tahap.map((t, i) => `<article class="stat-kartu ${t.perhatian ? 'stat-hambat' : ''}" data-kartu="${aman(t.kode)}"><div class="stat-baris"><h3><small>0${i + 1}</small> ${aman(t.nama)}</h3><span class="stat-label ${t.perhatian ? 'waspada' : ''}">${t.perhatian ? 'Perlu perhatian' : 'Terpantau'}</span></div><div class="stat-jumlah">${aman(t.aktif)} <span>pasien dalam tahap</span></div><dl><div><dt>Median durasi tahap</dt><dd>${durasi(t.median)}</dd></div><div><dt>P90 durasi tahap</dt><dd>${durasi(t.p90)}</dd></div><div><dt>Terlama saat ini</dt><dd>${durasi(t.terlama)}</dd></div></dl><p class="stat-catatan">${aman(t.sampel)} tahap selesai dalam periode · target acuan ${aman(t.target)} menit</p>${t.tanpa_waktu > 0 ? `<p class="stat-catatan">${aman(t.tanpa_waktu)} pasien belum memiliki waktu masuk tahap.</p>` : ''}<footer>60 menit terakhir: masuk ${aman(t.masuk_jam)} · selesai ${aman(t.selesai_jam)}</footer></article>`).join('')}</div>
      <div class="stat-dua"><section class="stat-panel"><h2>Durasi per tahap</h2><p>Median tahap selesai dibanding target acuan, dalam menit</p>${data.tahap.map(t => `<div class="stat-bar"><span>${aman(t.nama)}</span><div class="stat-jalur"><i style="width:${Math.min(100, (t.median ?? 0) / maksMedian * 100)}%;${t.perhatian ? 'background:var(--status-kuning-teks)' : ''}"></i><b style="left:${t.target / maksMedian * 100}%" title="Target ${aman(t.target)} menit"></b></div><strong>${angka(t.median)}</strong></div>`).join('')}<p class="stat-catatan">Garis tegak = target acuan. — = belum ada tahap selesai yang tercatat.</p></section><section class="stat-panel"><h2>Penumpukan per tahap</h2><p>Pasien dalam tahap pada 8 titik waktu terakhir · data tercatat</p>${grafikPenumpukan(data)}</section></div>
      <section class="stat-panel"><h2>Pasien yang perlu ditindaklanjuti</h2><p data-tindak-keterangan></p><div class="stat-tabel"><table><thead><tr><th>Antrean</th><th>Poli</th><th>Tahap</th><th>Durasi saat ini</th><th>Target acuan</th><th>Status</th></tr></thead><tbody data-tindak-isi></tbody></table></div></section>
      <div class="stat-dua"><section class="stat-panel"><h2>Tren kunjungan</h2><p>Jumlah kunjungan per tanggal · antrean batal dikecualikan</p><div class="stat-kolom">${data.tren.map(r => `<div title="${aman(r.tanggal)}: ${aman(r.jumlah)} kunjungan"><span>${aman(r.jumlah)}</span><i style="height:${Math.max(2, r.jumlah / Math.max(1, ...data.tren.map(t => t.jumlah)) * 110)}px"></i><small>${aman(r.tanggal.slice(8))}</small></div>`).join('')}</div></section><section class="stat-panel"><h2>Hari sibuk</h2><p>Rata-rata kunjungan per hari dalam periode terpilih</p>${data.hari.map(r => `<div class="stat-bar"><span>${aman(r.nama)}</span><div class="stat-jalur"><i style="width:${r.rata / Math.max(1, ...data.hari.map(h => h.rata)) * 100}%"></i></div><strong>${angka(r.rata)}</strong></div>`).join('')}</section></div>
      <section class="stat-panel"><h2>Pola hari dan jam sibuk</h2><p>Rata-rata kedatangan pada setiap hari dan jam, berdasarkan waktu pendaftaran (WIB).</p><div class="stat-tabel"><table class="stat-heat"><thead><tr><th>Hari / Jam</th>${data.jam.map((_, i) => `<th>${String(i).padStart(2, '0')}</th>`).join('')}</tr></thead><tbody>${data.kepadatan.map((row, i) => `<tr><th>${aman(data.hari[i].nama)}</th>${row.map((n, j) => `<td title="${aman(data.hari[i].nama)}, ${j}.00: ${angka(n)} pasien"${n ? ` style="background:color-mix(in srgb, var(--warna-utama) ${Math.round(15 + 65 * n / Math.max(1, ...data.kepadatan.flat()))}%, var(--warna-permukaan))"` : ''}>${n ? angka(n) : '·'}</td>`).join('')}</tr>`).join('')}</tbody></table></div></section>
      <p class="stat-catatan">Durasi tahap mencakup waktu menunggu dan pengerjaan; keduanya belum dicatat terpisah. P90 berarti 90% tahap selesai memiliki durasi paling lama sebesar nilai tersebut. Target adalah acuan operasional awal, bukan standar klinis. Riwayat mulai terkumpul sejak fitur diaktifkan; data lama tidak direkayasa. Filter tanggal berlaku untuk ringkasan dan tahap selesai; kondisi saat ini serta 60 menit terakhir selalu menggunakan waktu sekarang.</p>`;
    if (bukaAngka) isi.querySelector('details').open = true;
    tindakLanjut();
    if (fokusTahap !== undefined) [...isi.querySelectorAll('[data-pilih]')].find(t => t.dataset.pilih === fokusTahap)?.focus();
    else if (fokusAngka) isi.querySelector('summary')?.focus();
  }
  function mulaiMuat() {
    clearInterval(timer); const sekarang = ++versi; let sibuk = false;
    data = null; tampilkan();
    async function ambil() {
      if (sibuk || !aktif) return;
      sibuk = true; memuat = true; status();
      try {
        const baru = await panggilApi('GET', `/statistik/pelayanan?${new URLSearchParams({ dari, sampai, ...(poli ? { lokasi_id: poli } : {}) })}`);
        if (aktif && sekarang === versi) {
          data = baru; galat = '';
          cari('[name=poli]').innerHTML = `<option value="">Semua poli</option>${data.poli.map(p => `<option value="${aman(p.id)}">${aman(p.nama)}</option>`).join('')}`;
          cari('[name=poli]').value = poli; tampilkan();
        }
      } catch (e) { if (aktif && sekarang === versi) { data = null; galat = e instanceof Error ? e.message : 'Gagal memuat statistik.'; tampilkan(); } }
      finally { sibuk = false; if (aktif && sekarang === versi) { memuat = false; status(); } }
    }
    void ambil(); timer = setInterval(() => void ambil(), 60000);
  }
  function ubah(e) {
    if ((e.type === 'input' && e.target.tagName !== 'INPUT') || (e.type === 'change' && e.target.tagName === 'INPUT')) return;
    if (e.target.name === 'dari') dari = e.target.value;
    else if (e.target.name === 'sampai') sampai = e.target.value;
    else if (e.target.name === 'poli') poli = e.target.value;
    else return;
    filter(); mulaiMuat();
  }
  function klik(e) {
    if (!(e.target instanceof Element)) return;
    if (e.target.closest('[data-perbarui]')) mulaiMuat();
    else if (e.target.closest('[data-rentang]')) { sampai = hariIni; dari = tanggalWib(new Date(Date.now() - (Number(e.target.closest('[data-rentang]').dataset.rentang) - 1) * 86400000)); filter(); mulaiMuat(); }
    else if (e.target.closest('[data-pilih]')) { pilih = e.target.closest('[data-pilih]').dataset.pilih; tindakLanjut(); }
  }
  wadah.addEventListener('input', ubah); wadah.addEventListener('change', ubah); wadah.addEventListener('click', klik); filter(); mulaiMuat();
  return () => { aktif = false; versi++; clearInterval(timer); wadah.removeEventListener('input', ubah); wadah.removeEventListener('change', ubah); wadah.removeEventListener('click', klik); wadah.replaceChildren(); };
}
