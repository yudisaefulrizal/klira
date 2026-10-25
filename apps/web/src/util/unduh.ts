/** Mengunduh teks sebagai berkas lewat peramban (tautan sementara dari Blob). */
export function unduhTeks(nama: string, isi: string, tipe = 'text/csv;charset=utf-8'): void {
  const url = URL.createObjectURL(new Blob([isi], { type: tipe }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nama;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
