import { DAFTAR_PASIEN, FITUR_AKSES_PASIEN, HALAMAN_AWAL, HALAMAN_MENU, RAWAT_INAP, halamanMenuDiizinkan, punyaIzin } from '@klira/shared';
import { KUNCI_TEMA, temaTersimpan, terapkanTema } from '../../util/tema.js';
import { buatMenuPengguna } from './menu-pengguna.js';
import { pantauStatusKoneksi } from '../../util/panggilan/status-koneksi.js';
import { token } from '../../gaya/token.js';
import { daftarkanSlotHeader } from './slot-header.js';
import { PERISTIWA_ANTREAN_BERUBAH } from '../../util/panggilan/peristiwa-antrean.js';
import { pasangNotifikasiLayar } from './notifikasi-layar.js';
import { tab } from '../ui/primitif.js';
import { navigasi } from '../../util/navigasi/navigasi.js';
import { pilihTab } from '../../util/tab/ingatan-tab.js';
import { buatIkonMenu } from '../menu/ikon-menu.js';
import { HALAMAN_PENGATURAN, tabDiizinkan } from '../../util/tab/tab-pengaturan.js';

const ikonMatahari = '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>';
const ikonBulan = '<path d="M20.5 13A8.5 8.5 0 0 1 11 3.5 8.5 8.5 0 1 0 20.5 13Z"/>';
const ikonServer = '<rect x="3" y="3" width="18" height="7" rx="2"/><rect x="3" y="14" width="18" height="7" rx="2"/><path d="M7 6.5h.01M7 17.5h.01M11 6.5h6M11 17.5h6"/>';
const ikonLayar = '<rect x="2.5" y="3" width="19" height="14" rx="2"/><path d="M8 21h8m-4-4v4m-5-10h5m-5-4h9"/>';
function ikon(bentuk) { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${bentuk}</svg>`; }
function penanda(nada) {
  return `<svg class="status-koneksi-penanda" viewBox="0 0 12 12" aria-hidden="true"><circle cx="6" cy="6" r="5.5" fill="currentColor"/><path d="${nada === 'baik' ? 'm3 6 2 2 4-4' : nada === 'gagal' ? 'm4 4 4 4m0-4-4 4' : nada === 'netral' ? 'M3 6h6' : 'M6 3v3m0 2v1'}" fill="none" stroke="var(--warna-permukaan)" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
export function pasangTemaTampilan(wadah, pengguna, keluar) {
  let tema = temaTersimpan(), server = 'memeriksa', layar = { status: 'memeriksa', jumlah: null };
  const fasilitas = pengguna && !pengguna.wajib_ganti_kredensial ? pengguna.fasyankes_id : undefined;
  wadah.innerHTML = `<div style="position:sticky;top:0;z-index:40;display:flex;justify-content:flex-end;align-items:center;gap:10px;padding:8px 16px;background:var(--warna-permukaan);border-bottom:1px solid var(--warna-garis);box-shadow:0 2px 10px rgba(0,0,0,0.08)"><button type="button" data-tema-toggle style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:8px;border:1px solid var(--warna-garis);background:transparent;cursor:pointer;flex-shrink:0"></button><div class="status-koneksi" role="group" aria-label="Status koneksi"><span data-server class="status-koneksi-ikon" role="img" tabindex="0"></span><${fasilitas ? 'a' : 'span'} data-layar class="status-koneksi-ikon${fasilitas ? ' status-koneksi-tautan' : ''}"></${fasilitas ? 'a' : 'span'}></div></div>`;
  const slotHeader = document.createElement('div'); slotHeader.dataset.slotHeader = '';
  Object.assign(slotHeader.style, { flex: '1 1 auto', minWidth: '0', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', overflowX: 'auto' });
  wadah.firstElementChild.prepend(slotHeader);
  const cabutSlot = daftarkanSlotHeader(slotHeader);
  let lepasNavHeader, logoHeader = null;
  if (fasilitas) {
    const logo = document.createElement('a');
    logo.href = HALAMAN_AWAL.daftarPasien;
    logo.className = 'logo-header';
    logo.setAttribute('aria-label', 'Klira — Daftar pasien');
    logo.innerHTML = '<span class="logo-klira logo-klira-asli" style="--logo-klira-lebar:96px"><img src="/asset/brand/klira.png" alt="Klira" width="2172" height="724"></span>';
    logo.addEventListener('click', e => { e.preventDefault(); navigasi.pindah(HALAMAN_AWAL.daftarPasien); });
    logoHeader = logo;
    const boleh = (f, a) => punyaIzin(pengguna, f, a);
    const T = DAFTAR_PASIEN.tab, bolehPasien = boleh('pasien', 'lihat') || boleh('rekam-medis', 'lihat');
    const daftarHeader = [
      ...(FITUR_AKSES_PASIEN.some(f => boleh(f, 'lihat')) ? [{ id: 'antrean', label: T.antrean }] : []),
      ...(bolehPasien ? [{ id: 'pasien', label: T.pasien }] : []),
      ...(boleh('master', 'lihat') ? [{ id: 'praktisi', label: T.praktisi }, { id: 'jadwal', label: T.jadwal }] : []),
      ...(boleh('klinis', 'lihat') || boleh('master', 'lihat') ? [{ id: 'rawat-inap', label: RAWAT_INAP.judul }] : []),
      ...(boleh('penunjang', 'lihat') ? [{ id: 'lab', label: 'Lab', path: '/penunjang' }] : []),
      ...(boleh('farmasi', 'lihat') ? [{ id: 'farmasi', label: 'Farmasi', path: '/farmasi' }] : []),
      ...(boleh('kasir', 'lihat') || boleh('klaim', 'lihat') ? [{ id: 'kasir-klaim', label: 'Kasir dan klaim', path: '/kasir-klaim' }] : []),
    ];
    if (daftarHeader.length > 1) {
      const idsHeader = daftarHeader.map(t => t.id);
      const ruteHeader = new Map(daftarHeader.filter(t => t.path).map(t => [t.id, t.path]));
      const navHeader = tab(daftarHeader, '', DAFTAR_PASIEN.judul, id => navigasi.pindah(ruteHeader.get(id) ?? (id === 'antrean' ? '/pasien' : `/pasien?tab=${id}`)));
      slotHeader.append(navHeader.el);
      const perbaruiHeader = () => {
        const { path, search } = navigasi.potret();
        const dariPath = [...ruteHeader.entries()].find(([, p]) => p === path)?.[0];
        navHeader.pilih(dariPath ?? (path === '/pasien' ? (idsHeader.length ? pilihTab(idsHeader, new URLSearchParams(search).get('tab'), null) : 'antrean') : ''));
      };
      perbaruiHeader();
      lepasNavHeader = navigasi.langganan(perbaruiHeader);
    }
  }
  // Menu pengguna di pojok kiri bilah atas; logo Klira di pojok kanan.
  const menuPengguna = pengguna && keluar ? buatMenuPengguna({ pengguna, keluar }) : null;
  if (menuPengguna) wadah.firstElementChild.prepend(menuPengguna.el);
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
    const gelap = tema === 'gelap' || (tema === 'sistem' && media.matches);
    const btn = wadah.querySelector('[data-tema-toggle]');
    if (!btn) return;
    const label = gelap ? 'Tema gelap — klik untuk terang' : 'Tema terang — klik untuk gelap';
    btn.setAttribute('aria-pressed', String(!gelap));
    btn.setAttribute('aria-label', label);
    btn.title = label;
    btn.dataset.tooltip = label;
    btn.style.color = gelap ? token.warna.teksMenu : '#f59e0b';
    btn.innerHTML = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${gelap ? ikonBulan : ikonMatahari}</svg>`;
  }
  function klik(e) {
    const tombol = e.target.closest('[data-tema-toggle]'); if (!tombol) return;
    const sedangGelap = tema === 'gelap' || (tema === 'sistem' && media.matches);
    tema = sedangGelap ? 'terang' : 'gelap';
    perbaruiTema();
    try { localStorage.setItem(KUNCI_TEMA, tema); } catch { /* Pilihan tetap berlaku selama halaman terbuka. */ }
  }
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  function sinkronkan(e) { if (e.key === KUNCI_TEMA || e.key === null) { tema = temaTersimpan(); perbaruiTema(); } }
  const pantau = pantauStatusKoneksi(fasilitas, { asal: window.location.origin,
    server(baru) { server = baru; perbaruiStatus(); }, layar(baru) { layar = baru; perbaruiStatus(); },
    antrean() { window.dispatchEvent(new CustomEvent(PERISTIWA_ANTREAN_BERUBAH)); },
  });
  const periksa = () => void pantau.periksaServer();
  const notifikasiLayar = pasangNotifikasiLayar(wadah.querySelector('.status-koneksi'), pengguna);
  let lepasNavAtas;
  if (fasilitas) {
    const diizinkanMenu = new Set(halamanMenuDiizinkan(pengguna.fitur ?? []).map(m => m.path));
    const daftarIkonAtas = [
      { path: HALAMAN_AWAL.berandaTugas, boleh: diizinkanMenu.has(HALAMAN_AWAL.berandaTugas) },
      { path: '/statistik', boleh: diizinkanMenu.has('/statistik') },
      { path: '/pesan', boleh: diizinkanMenu.has('/pesan') },
      { path: '/akses', boleh: tabDiizinkan(HALAMAN_PENGATURAN.akses.tab, pengguna).length > 0 },
      { path: '/pengaturan-klinik', boleh: tabDiizinkan(HALAMAN_PENGATURAN.klinik.tab, pengguna).length > 0 },
    ].filter(x => x.boleh);
    if (daftarIkonAtas.length) {
      const grup = document.createElement('div');
      Object.assign(grup.style, { display: 'inline-flex', alignItems: 'center', gap: '6px' });
      const tautanAtas = daftarIkonAtas.map(({ path: p }) => {
        const meta = HALAMAN_MENU.find(m => m.path === p);
        const label = meta?.label ?? HALAMAN_PENGATURAN[p === '/akses' ? 'akses' : 'klinik'].judul;
        const a = document.createElement('a');
        a.href = p;
        a.setAttribute('aria-label', label);
        a.title = label;
        a.dataset.tooltip = label;
        Object.assign(a.style, {
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: '32px', height: '32px', borderRadius: token.radius.sedang,
          border: `${token.ukuran.garis} solid ${token.warna.garis}`,
          textDecoration: 'none',
        });
        const ikonEl = buatIkonMenu(p);
        if (ikonEl) a.append(ikonEl);
        a.addEventListener('click', e => { e.preventDefault(); navigasi.pindah(p); });
        grup.append(a);
        return { a, path: p };
      });
      const perbaruiIkonAtas = () => {
        const aktif = navigasi.potret().path;
        for (const { a, path: p } of tautanAtas) {
          const on = aktif === p;
          if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
          Object.assign(a.style, {
            color: on ? token.warna.utamaGelap : token.warna.teksMenu,
            background: on ? token.warna.utamaLatar : 'transparent',
            borderColor: on ? token.warna.utama : token.warna.garis,
          });
        }
      };
      perbaruiIkonAtas();
      lepasNavAtas = navigasi.langganan(perbaruiIkonAtas);
      wadah.firstElementChild.append(grup);
    }
  }
  if (logoHeader) wadah.firstElementChild.append(logoHeader);
  wadah.addEventListener('click', klik); media.addEventListener('change', perbaruiTema); window.addEventListener('storage', sinkronkan);
  window.addEventListener('online', periksa); window.addEventListener('offline', periksa);
  perbaruiTema(); perbaruiStatus();
  return () => {
    cabutSlot(); lepasNavHeader?.(); lepasNavAtas?.(); menuPengguna?.tutup(); notifikasiLayar.tutup(); pantau.tutup(); wadah.removeEventListener('click', klik); media.removeEventListener('change', perbaruiTema); window.removeEventListener('storage', sinkronkan);
    window.removeEventListener('online', periksa); window.removeEventListener('offline', periksa); wadah.replaceChildren();
  };
}
