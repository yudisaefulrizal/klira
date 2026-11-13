export function AvatarKontak(props) {
  let gagal = null;
  const el = document.createElement('span'); el.className = 'wa-avatar'; el.setAttribute('aria-hidden', 'true'); el.style.overflow = 'hidden';
  function perbarui(baru = {}) {
    props = { ...props, ...baru }; const { id, nama, foto } = props; el.dataset.warna = String(id % 4);
    if (foto && gagal !== foto) { const img = document.createElement('img'); img.src = foto; img.alt = ''; img.referrerPolicy = 'no-referrer'; img.loading = 'lazy'; Object.assign(img.style, { width: '100%', height: '100%', objectFit: 'cover' }); img.addEventListener('error', () => { gagal = foto; perbarui(); }); el.replaceChildren(img); }
    else el.textContent = nama.split(/\s+/).slice(0, 2).map(v => v[0]).join('').toUpperCase();
  }
  perbarui(); el.perbarui = perbarui; return el;
}
