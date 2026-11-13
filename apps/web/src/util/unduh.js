/** Mengunduh teks sebagai berkas lewat peramban (tautan sementara dari Blob). */
export function unduhTeks(nama, isi, tipe = 'text/csv;charset=utf-8') {
    const url = URL.createObjectURL(new Blob([isi], { type: tipe }));
    const a = document.createElement('a');
    a.href = url;
    a.download = nama;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}
