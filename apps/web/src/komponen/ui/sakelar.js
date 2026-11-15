import { token } from '../../gaya/token.js';

let gayaDipasang = false;
function pasangGaya() {
    if (gayaDipasang || document.querySelector('style[data-sakelar]')) { gayaDipasang = true; return; }
    const g = document.createElement('style'); g.dataset.sakelar = '';
    g.textContent = '.sakelar:focus-visible { outline: 2px solid var(--warna-utama); outline-offset: 2px; } .sakelar:disabled { cursor: not-allowed; opacity: .55; } .sakelar-titik { transition: transform .15s ease; } @media (prefers-reduced-motion: reduce) { .sakelar-titik { transition: none; } }';
    document.head.append(g); gayaDipasang = true;
}
/**
 * Sakelar (toggle) hidup/mati dengan teks keadaan di sampingnya. `teks(nilai)` memberi tulisan menurut keadaan (mis. Aktif / Tidak aktif);
 * `onUbah(nilaiBaru)` dipanggil saat diklik dan bertugas memperbarui lewat `setNilai` bila perubahan berhasil (atau membiarkannya bila gagal).
 */
export function buatSakelar({ nilai = false, teks, label, onUbah, disabled = false }) {
    pasangGaya();
    const el = document.createElement('span'), tombol = document.createElement('button'), titik = document.createElement('span'), tulisan = document.createElement('span');
    Object.assign(el.style, { display: 'inline-flex', alignItems: 'center', gap: token.jarak.sm });
    tombol.type = 'button'; tombol.className = 'sakelar'; tombol.setAttribute('role', 'switch'); if (label) tombol.setAttribute('aria-label', label); tombol.disabled = disabled;
    Object.assign(tombol.style, { position: 'relative', width: '40px', height: '22px', padding: '0', border: '0', borderRadius: '999px', cursor: 'pointer', flexShrink: '0' });
    titik.className = 'sakelar-titik';
    Object.assign(titik.style, { position: 'absolute', top: '2px', left: '2px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,.35)' });
    tombol.append(titik); el.append(tombol, tulisan);
    let kini = !!nilai, sibuk = false;
    function lukis() {
        tombol.setAttribute('aria-checked', String(kini));
        tombol.style.background = kini ? token.warna.utama : token.warna.garisIsian;
        titik.style.transform = kini ? 'translateX(18px)' : 'translateX(0)';
        tulisan.textContent = teks(kini); tulisan.style.color = kini ? token.warna.teks : token.warna.teksRedup;
        tombol.disabled = disabled || sibuk;
    }
    tombol.addEventListener('click', () => { if (!sibuk) onUbah?.(!kini); });
    lukis();
    return {
        el, tombol,
        setNilai(v) { kini = !!v; lukis(); },
        setMemproses(v) { sibuk = !!v; tombol.style.cursor = sibuk ? 'progress' : disabled ? 'not-allowed' : 'pointer'; lukis(); },
    };
}
