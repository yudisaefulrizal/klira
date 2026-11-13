export const batasi = (indeks, jumlah) => Math.max(0, Math.min(jumlah - 1, Math.trunc(indeks) || 0));
export const langkahBerikut = (indeks, jumlah) => batasi(indeks + 1, jumlah);
export const langkahSebelum = (indeks, jumlah) => batasi(indeks - 1, jumlah);
export const adalahTerakhir = (indeks, jumlah) => jumlah > 0 && indeks >= jumlah - 1;
export const adalahPertama = (indeks) => indeks <= 0;
/** Posisi tampilan "2 dari 4" (indeks mulai dari 0). */
export const posisiLangkah = (indeks, jumlah) => ({ nomor: batasi(indeks, jumlah) + 1, dari: jumlah });
/** Penanda tiap langkah: yang sudah dinyatakan selesai, yang aktif, atau belum (daftar bisa diklik untuk semuanya). */
export function statusLangkah(indeks, jumlah, selesai) {
    return Array.from({ length: jumlah }, (_, i) => (i === indeks ? 'aktif' : selesai[i] ? 'selesai' : 'belum'));
}
/** Langkah pertama yang belum valid (untuk mengarahkan pengguna saat kirim); -1 bila semua valid. */
export function langkahBermasalah(galatPerLangkah) {
    return galatPerLangkah.findIndex((g) => !!g);
}
