/** Escape data teks/atribut sebelum dimasukkan ke template HTML milik aplikasi. */
export function teksHtml(nilai) {
  return String(nilai ?? '').replace(/[&<>"']/g, karakter => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[karakter]);
}
