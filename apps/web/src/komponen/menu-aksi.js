import { token } from '../gaya/token.js';
let nomor = 0;
export function MenuAksi({ label, items }) {
  const id = `menu-aksi-${++nomor}`, button = document.createElement('button'); let daftar;
  button.type = 'button'; button.title = label; button.setAttribute('aria-label', label); button.setAttribute('aria-haspopup', 'menu'); button.setAttribute('aria-expanded', 'false');
  Object.assign(button.style, { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: token.ukuran.tombol, height: token.ukuran.tombol, padding: '0', cursor: 'pointer', border: `${token.ukuran.garis} solid ${token.warna.garis}`, borderRadius: token.radius.sedang, background: 'transparent', color: token.warna.teksMenu });
  button.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>';
  function tutup(fokus = false) { daftar?.remove(); daftar = undefined; button.setAttribute('aria-expanded', 'false'); button.removeAttribute('aria-controls'); button.style.background = 'transparent'; window.removeEventListener('scroll', tutupSaja, true); window.removeEventListener('resize', tutupSaja); document.removeEventListener('pointerdown', luar); if (fokus) button.focus(); }
  function tutupSaja() { tutup(); }
  function luar(e) { if (!daftar?.contains(e.target) && !button.contains(e.target)) tutup(); }
  function buka() {
    const r = button.getBoundingClientRect(), perkiraan = items.length * 41 + 12, ruangBawah = window.innerHeight - r.bottom - 14, ruangAtas = r.top - 14, atas = ruangBawah < perkiraan && ruangAtas > ruangBawah;
    daftar = document.createElement('div'); daftar.id = id; daftar.setAttribute('role', 'menu'); daftar.setAttribute('aria-label', label);
    Object.assign(daftar.style, { position: 'fixed', right: `${Math.max(8, window.innerWidth - r.right)}px`, top: `${atas ? r.top - 6 : r.bottom + 6}px`, transform: atas ? 'translateY(-100%)' : '', zIndex: String(token.lapis.konfirmasi + 100), minWidth: '200px', maxWidth: 'calc(100vw - 16px)', padding: token.jarak.xs, borderRadius: token.radius.sedang, background: token.warna.permukaan, border: `${token.ukuran.garis} solid ${token.warna.garis}`, boxShadow: token.bayangan.modal, display: 'flex', flexDirection: 'column', gap: '2px', fontFamily: token.huruf.keluarga, maxHeight: `${Math.max(120, atas ? ruangAtas : ruangBawah)}px`, overflowY: 'auto' });
    for (const item of items) { const b = document.createElement('button'), teks = document.createElement('span'); b.type = 'button'; b.setAttribute('role', 'menuitem'); b.disabled = !!item.disabled; teks.textContent = item.label; if (item.ikon) b.append(item.ikon); b.append(teks);
      Object.assign(b.style, { display: 'flex', alignItems: 'center', gap: token.jarak.sm, width: '100%', padding: `${token.jarak.sm} ${token.jarak.sm}`, border: '0', borderRadius: token.radius.kecil, background: 'transparent', color: token.warna.teks, fontSize: token.huruf.ukuran.dasar, fontFamily: token.huruf.keluarga, textAlign: 'left', cursor: item.disabled ? 'not-allowed' : 'pointer', opacity: item.disabled ? '0.5' : '1' }); b.addEventListener('click', () => { tutup(); item.onPilih(); }); daftar.append(b);
    }
    daftar.addEventListener('keydown', e => { const butir = [...daftar.querySelectorAll('button:not([disabled])')], i = butir.indexOf(document.activeElement); if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); tutup(true); } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); butir[(i + (e.key === 'ArrowDown' ? 1 : -1) + butir.length) % butir.length]?.focus(); } });
    document.body.append(daftar); button.setAttribute('aria-expanded', 'true'); button.setAttribute('aria-controls', id); button.style.background = token.warna.utamaLatar;
    window.addEventListener('scroll', tutupSaja, true); window.addEventListener('resize', tutupSaja); document.addEventListener('pointerdown', luar); daftar.querySelector('button:not([disabled])')?.focus();
  }
  button.addEventListener('click', () => daftar ? tutup() : buka()); button.tutup = tutupSaja; return button;
}
