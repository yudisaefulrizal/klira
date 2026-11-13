import { koneksiWa } from '../../../api-klien/instagram.js';
import { IsiPesan } from './panel-pesan.js';
import { sesiPesan } from './konteks-pesan.js';
export function HalamanPesanInstagram() {
  const el = document.createElement('section'), header = document.createElement('header'), title = document.createElement('div'), h = document.createElement('h1'), p = document.createElement('p'), status = document.createElement('span'), point = document.createElement('i'), label = document.createElement('span'), contenu = IsiPesan({ penuh: true });
  let actif = true, version = 0, revision = sesiPesan.potret().revisi; el.className = 'wa-halaman'; header.className = 'wa-halaman-kepala'; h.textContent = 'Pesan Instagram'; p.textContent = 'Respons cepat untuk percakapan pribadi'; title.append(h, p); status.className = 'wa-status-koneksi'; status.setAttribute('role', 'status'); point.setAttribute('aria-hidden', 'true'); status.append(point, label); header.append(title, status); el.append(header, contenu);
  async function muat() { const saat = ++version; let koneksi = null; try { koneksi = await koneksiWa(); } catch {} if (!actif || saat !== version) return; const aktif = koneksi?.status === 'terhubung' && koneksi.tersedia; status.dataset.aktif = String(!!aktif); label.textContent = aktif ? 'Instagram terhubung' : koneksi?.status === 'qr' ? 'Menunggu pemindaian QR' : koneksi?.status === 'menghubungkan' ? 'Menghubungkan Instagram' : 'Instagram belum terhubung'; }
  const lepas = sesiPesan.langganan(() => { const next = sesiPesan.potret().revisi; if (next !== revision) { revision = next; void muat(); } }); void muat(); el.tutup = () => { actif = false; version++; lepas(); contenu.tutup(); }; return el;
}
