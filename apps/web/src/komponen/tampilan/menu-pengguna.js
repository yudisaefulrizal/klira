import { MASUK } from '@klira/shared';

const inisial = (nama) => (nama ?? '?').replace(/^(dr|drg|apt|ns|bd)\.?\s+/i, '').trim().split(/\s+/).slice(0, 2).map((k) => k[0]?.toUpperCase() ?? '').join('') || '?';
const ikonPanah = '<svg viewBox="0 0 24 24" aria-hidden="true" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';

/**
 * Menu pengguna di bilah atas (kiri): avatar inisial, nama, dan peran. Dropdown berisi semua peran dan tombol Keluar.
 * Menutup lewat klik di luar, Escape, atau memilih Keluar; fokus kembali ke tombol pemicu.
 */
export function buatMenuPengguna({ pengguna, keluar }) {
  const el = document.createElement('div'); el.className = 'menu-pengguna';
  const pemicu = document.createElement('button'); pemicu.type = 'button'; pemicu.className = 'menu-pengguna-pemicu';
  pemicu.setAttribute('aria-haspopup', 'menu'); pemicu.setAttribute('aria-expanded', 'false'); pemicu.setAttribute('aria-controls', 'menu-pengguna-daftar');
  const peran = pengguna.jenis_akun ?? [];
  pemicu.innerHTML = `<span class="menu-pengguna-avatar" aria-hidden="true"></span><span class="menu-pengguna-teks"><strong></strong><small></small></span>${ikonPanah}`;
  pemicu.querySelector('.menu-pengguna-avatar').textContent = inisial(pengguna.nama);
  pemicu.querySelector('strong').textContent = pengguna.nama;
  pemicu.querySelector('small').textContent = `${peran[0] ?? ''}${peran.length > 1 ? ` · +${peran.length - 1}` : ''}`;
  pemicu.title = `${pengguna.nama}${peran.length ? ` — ${peran.join(', ')}` : ''}`;

  const daftar = document.createElement('div'); daftar.id = 'menu-pengguna-daftar'; daftar.className = 'menu-pengguna-daftar'; daftar.setAttribute('role', 'menu'); daftar.hidden = true;
  const kepala = document.createElement('div'); kepala.className = 'menu-pengguna-kepala';
  const nama = document.createElement('strong'); nama.textContent = pengguna.nama; kepala.append(nama);
  for (const p of peran) { const baris = document.createElement('small'); baris.textContent = p; kepala.append(baris); }
  const tombolKeluar = document.createElement('button'); tombolKeluar.type = 'button'; tombolKeluar.setAttribute('role', 'menuitem'); tombolKeluar.className = 'menu-pengguna-keluar'; tombolKeluar.textContent = MASUK.keluar;
  daftar.append(kepala, tombolKeluar); el.append(pemicu, daftar);

  function buka(nilai, fokus = false) {
    daftar.hidden = !nilai; pemicu.setAttribute('aria-expanded', String(nilai));
    if (nilai) { document.addEventListener('pointerdown', luar, true); document.addEventListener('keydown', tombol, true); if (fokus) tombolKeluar.focus(); }
    else { document.removeEventListener('pointerdown', luar, true); document.removeEventListener('keydown', tombol, true); }
  }
  function luar(e) { if (!el.contains(e.target)) buka(false); }
  function tombol(e) { if (e.key === 'Escape') { e.stopPropagation(); buka(false); pemicu.focus(); } }
  pemicu.addEventListener('click', () => buka(daftar.hidden, true));
  tombolKeluar.addEventListener('click', () => { buka(false); void keluar(); });
  return { el, tutup() { buka(false); el.remove(); } };
}
