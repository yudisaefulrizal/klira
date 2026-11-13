import { KUNCI_TEMA, temaTersimpan, terapkanTema } from '../../util/tema.js';
import { pantauStatusKoneksi } from '../../util/panggilan/status-koneksi.js';

const pilihanTema = [
  { nilai: 'terang', label: 'Terang', ikon: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>' },
  { nilai: 'sistem', label: 'Sistem', ikon: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8m-4-4v4"/>' },
  { nilai: 'gelap', label: 'Gelap', ikon: '<path d="M20.5 13A8.5 8.5 0 0 1 11 3.5 8.5 8.5 0 1 0 20.5 13Z"/>' },
];
const ikonServer = '<rect x="3" y="3" width="18" height="7" rx="2"/><rect x="3" y="14" width="18" height="7" rx="2"/><path d="M7 6.5h.01M7 17.5h.01M11 6.5h6M11 17.5h6"/>';
const ikonLayar = '<rect x="2.5" y="3" width="19" height="14" rx="2"/><path d="M8 21h8m-4-4v4m-5-10h5m-5-4h9"/>';
function ikon(bentuk) { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${bentuk}</svg>`; }
function penanda(nada) {
  return `<svg class="status-koneksi-penanda" viewBox="0 0 12 12" aria-hidden="true"><circle cx="6" cy="6" r="5.5" fill="currentColor"/><path d="${nada === 'baik' ? 'm3 6 2 2 4-4' : nada === 'gagal' ? 'm4 4 4 4m0-4-4 4' : nada === 'netral' ? 'M3 6h6' : 'M6 3v3m0 2v1'}" fill="none" stroke="var(--warna-permukaan)" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
export function pasangTemaTampilan(wadah, pengguna) {
  let tema = temaTersimpan(), server = 'memeriksa', layar = { status: 'memeriksa', jumlah: null };
  const fasilitas = pengguna && !pengguna.wajib_ganti_kredensial ? pengguna.fasyankes_id : undefined;
  wadah.innerHTML = `<div style="display:flex;justify-content:flex-end;align-items:center;gap:8px;padding:8px 16px;background:var(--warna-permukaan);border-bottom:1px solid var(--warna-garis)"><span class="pemilih-tema-label">Tampilan</span><div class="pemilih-tema" role="group" aria-label="Pilih tema tampilan"><span class="pemilih-tema-indikator" aria-hidden="true"></span>${pilihanTema.map(p => `<button type="button" class="pemilih-tema-opsi" data-tema="${p.nilai}" title="${p.nilai === 'sistem' ? 'Ikuti tema sistem' : `Tema ${p.label.toLowerCase()}`}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p.ikon}</svg><span>${p.label}</span></button>`).join('')}</div><div class="status-koneksi" role="group" aria-label="Status koneksi"><span data-server class="status-koneksi-ikon" role="img" tabindex="0"></span><${fasilitas ? 'a' : 'span'} data-layar class="status-koneksi-ikon${fasilitas ? ' status-koneksi-tautan' : ''}"></${fasilitas ? 'a' : 'span'}></div></div>`;
  const statusServer = wadah.querySelector('[data-server]'), statusLayar = wadah.querySelector('[data-layar]');
  if (fasilitas) { statusLayar.href = `/layar-panggilan/${fasilitas}`; statusLayar.target = '_blank'; statusLayar.rel = 'noopener noreferrer'; }
  else { statusLayar.setAttribute('role', 'img'); statusLayar.tabIndex = 0; }
  function perbaruiStatus() {
    const labelServer = server === 'terhubung' ? 'Server terhubung' : server === 'terputus' ? 'Server tidak dapat dijangkau' : 'Memeriksa koneksi server';
    const labelLayar = !fasilitas ? 'Layar panggilan: masuk untuk melihat status fasilitas' : server === 'terputus' ? 'Layar panggilan: status tidak diketahui karena server terputus' : layar.status === 'terhubung' ? `Layar panggilan: ${layar.jumlah} layar tersambung` : layar.status === 'tidak-ada' ? 'Layar panggilan: belum ada layar tersambung' : layar.status === 'memeriksa' ? 'Memeriksa koneksi layar panggilan' : 'Koneksi pemantauan layar terputus; mencoba kembali';
    const nadaServer = server === 'terhubung' ? 'baik' : server === 'terputus' ? 'gagal' : 'tunggu';
    const nadaLayar = !fasilitas ? 'netral' : server === 'terputus' ? 'gagal' : layar.status === 'terhubung' ? 'baik' : layar.status === 'tidak-ada' ? 'netral' : 'tunggu';
    statusServer.dataset.nada = nadaServer; statusServer.setAttribute('aria-label', labelServer); statusServer.dataset.tooltip = labelServer;
    statusServer.innerHTML = ikon(ikonServer) + penanda(nadaServer);
    statusLayar.dataset.nada = nadaLayar; statusLayar.setAttribute('aria-label', fasilitas ? `${labelLayar}. Buka layar panggilan` : labelLayar); statusLayar.dataset.tooltip = fasilitas ? `${labelLayar} — klik untuk membuka` : labelLayar;
    statusLayar.innerHTML = ikon(ikonLayar) + penanda(nadaLayar);
  }
  function perbaruiTema() {
    terapkanTema(tema);
    wadah.querySelector('.pemilih-tema').style.setProperty('--tema-indeks', pilihanTema.findIndex(p => p.nilai === tema));
    wadah.querySelectorAll('[data-tema]').forEach(t => t.setAttribute('aria-pressed', String(t.dataset.tema === tema)));
  }
  function klik(e) {
    const tombol = e.target.closest('[data-tema]'); if (!tombol) return;
    tema = tombol.dataset.tema; perbaruiTema();
    try { localStorage.setItem(KUNCI_TEMA, tema); } catch { /* Pilihan tetap berlaku selama halaman terbuka. */ }
  }
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  function sinkronkan(e) { if (e.key === KUNCI_TEMA || e.key === null) { tema = temaTersimpan(); perbaruiTema(); } }
  const pantau = pantauStatusKoneksi(fasilitas, { asal: window.location.origin,
    server(baru) { server = baru; perbaruiStatus(); }, layar(baru) { layar = baru; perbaruiStatus(); },
  });
  const periksa = () => void pantau.periksaServer();
  wadah.addEventListener('click', klik); media.addEventListener('change', perbaruiTema); window.addEventListener('storage', sinkronkan);
  window.addEventListener('online', periksa); window.addEventListener('offline', periksa);
  perbaruiTema(); perbaruiStatus();
  return () => {
    pantau.tutup(); wadah.removeEventListener('click', klik); media.removeEventListener('change', perbaruiTema); window.removeEventListener('storage', sinkronkan);
    window.removeEventListener('online', periksa); window.removeEventListener('offline', periksa); wadah.replaceChildren();
  };
}
