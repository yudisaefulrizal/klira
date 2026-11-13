/** Selama transisi, rute yang sudah mandiri berpindah dokumen agar tidak memuat kerangka React. */
export const ruteDokumenNative = path => path === '/' || path === '/masuk' || path === '/ganti-kredensial' || /^\/klinik\/[a-z0-9-]+\/?$/.test(path) || /^\/layar-panggilan(?:\/|$)/.test(path);

/** Pembungkus History API; tidak merender halaman atau mengatur state komponen. */
export function buatNavigasi(w, ruteDokumen = () => false) {
  const pendengar = new Set();
  const baca = () => ({ path: w.location.pathname, search: w.location.search });
  let lokasi = baca(), dipantau = false;
  function beri() { lokasi = baca(); pendengar.forEach(f => f()); }
  function kembali() { if (ruteDokumen(w.location.pathname)) w.location.reload(); else beri(); }
  function terapkan(ke, ganti) {
    const url = new URL(ke, w.location.origin);
    if (ruteDokumen(url.pathname)) { if (ganti) w.location.replace(ke); else w.location.assign(ke); return; }
    if (ganti) w.history.replaceState(null, '', ke); else w.history.pushState(null, '', ke);
    beri();
  }
  return {
    potret: () => lokasi,
    langganan(f) { pendengar.add(f); return () => pendengar.delete(f); },
    pindah: ke => terapkan(ke, false), ganti: ke => terapkan(ke, true),
    mulai() { if (!dipantau) { dipantau = true; w.addEventListener('popstate', kembali); } },
    tutup() { if (dipantau) w.removeEventListener('popstate', kembali); dipantau = false; },
  };
}
