import type { KlinikPublikDto } from '@klira/shared';
const escapeHtml = (teks: string) => teks.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const jsonAman = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

/** Identitas publik tersedia pada HTML awal dan bootstrap, tanpa data sesi maupun pasien. */
export function htmlKlinikPublik(html: string, data: KlinikPublikDto | null): string {
  const judul = data ? `${data.nama} — Layanan dan jadwal praktik` : 'Halaman klinik belum tersedia';
  let hasil = html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(judul)}</title>`);
  if (!data) return hasil.replace('</head>', '<meta name="robots" content="noindex" /></head>');
  const schema = { '@context': 'https://schema.org', '@type': 'MedicalClinic', name: data.nama, description: data.ringkasan, ...(data.alamat ? { address: data.alamat } : {}), ...(data.telepon ? { telephone: data.telepon } : {}), ...(data.email ? { email: data.email } : {}), ...(data.domain ? { url: `https://${data.domain}/` } : {}) };
  hasil = hasil.replace('</head>', `<meta name="description" content="${escapeHtml(data.ringkasan)}" /><meta property="og:title" content="${escapeHtml(data.nama)}" /><meta property="og:description" content="${escapeHtml(data.ringkasan)}" /><meta property="og:type" content="website" /><script type="application/ld+json">${jsonAman(schema)}</script><script>window.__KLINIK_PUBLIK__=${jsonAman(data)};</script></head>`);
  const cadangan = `<noscript><h1>${escapeHtml(data.nama)}</h1><h2>${escapeHtml(data.judul)}</h2><p>${escapeHtml(data.ringkasan)}</p><p>${escapeHtml(data.tentang)}</p><address>${escapeHtml(data.alamat)}</address><ul>${data.layanan.map(l => `<li>${escapeHtml(l.nama)}</li>`).join('')}</ul>${data.telepon ? `<p>${escapeHtml(data.telepon)}</p>` : ''}<a href="/masuk">Masuk petugas</a></noscript>`;
  return hasil.replace('</body>', `${cadangan}</body>`);
}
