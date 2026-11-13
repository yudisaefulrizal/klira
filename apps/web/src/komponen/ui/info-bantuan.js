import { TOMBOL } from '@klira/shared';
import { token } from '../../gaya/token.js';
let nomor = 0;
const LEBAR_MAKS = 280;
export function InfoBantuan({ label, children }) {
  const id = `info-bantuan-${++nomor}`, button = document.createElement('button');
  let gelembung, terkunci = false;
  button.type = 'button'; button.setAttribute('aria-label', `${TOMBOL.penjelasan}: ${label}`);
  Object.assign(button.style, { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0', border: '0', background: 'transparent', cursor: 'help', color: token.warna.teksRedup });
  button.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/></svg>';
  function tutup() {
    gelembung?.remove(); gelembung = undefined; terkunci = false; button.removeAttribute('aria-describedby'); button.style.color = token.warna.teksRedup;
    window.removeEventListener('scroll', tutup, true); window.removeEventListener('resize', tutup); document.removeEventListener('pointerdown', luar);
  }
  function luar(e) { if (!button.contains(e.target)) tutup(); }
  function tampil() {
    const r = button.getBoundingClientRect(), bawah = r.top < 140;
    const x = Math.max(LEBAR_MAKS / 2 + 12, Math.min(window.innerWidth - LEBAR_MAKS / 2 - 12, r.left + r.width / 2));
    if (!gelembung) {
      gelembung = document.createElement('span'); gelembung.id = id; gelembung.setAttribute('role', 'tooltip'); gelembung.textContent = children;
      Object.assign(gelembung.style, { position: 'fixed', zIndex: String(token.lapis.konfirmasi + 100), width: 'max-content', maxWidth: `min(${LEBAR_MAKS}px, calc(100vw - 24px))`, padding: '8px 11px', borderRadius: token.radius.sedang, background: token.warna.teks, color: token.warna.permukaan, boxShadow: token.bayangan.kartu, fontFamily: token.huruf.keluarga, fontSize: token.huruf.ukuran.kecil, fontWeight: token.huruf.berat.sedang, lineHeight: '1.5', textAlign: 'left', pointerEvents: 'none' });
      document.body.append(gelembung); window.addEventListener('scroll', tutup, true); window.addEventListener('resize', tutup); document.addEventListener('pointerdown', luar);
    }
    Object.assign(gelembung.style, { left: `${x}px`, top: `${bawah ? r.bottom + 8 : r.top - 8}px`, transform: bawah ? 'translate(-50%, 0)' : 'translate(-50%, -100%)' });
    button.setAttribute('aria-describedby', id); button.style.color = token.warna.utamaGelap;
  }
  button.addEventListener('mouseenter', tampil); button.addEventListener('mouseleave', () => { if (!terkunci) tutup(); }); button.addEventListener('focus', tampil); button.addEventListener('blur', tutup);
  button.addEventListener('click', () => { if (gelembung && terkunci) tutup(); else { tampil(); terkunci = true; } });
  button.addEventListener('keydown', e => { if (e.key === 'Escape' && gelembung) { e.preventDefault(); e.stopPropagation(); tutup(); } });
  button.tutup = tutup; return button;
}
