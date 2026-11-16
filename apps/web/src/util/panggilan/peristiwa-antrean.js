/** Server memberi sinyal lewat WebSocket bahwa antrean berubah; halaman yang menampilkan antrean membaca ulang lewat API. */
export const PERISTIWA_ANTREAN_BERUBAH = 'klira:antrean-berubah';
/** Menggabungkan sinyal beruntun menjadi satu pemuatan. Mengembalikan fungsi pelepas. */
export function dengarAntreanBerubah(panggil, tunda = 300) {
    let timer;
    const tangani = () => { clearTimeout(timer); timer = setTimeout(panggil, tunda); };
    window.addEventListener(PERISTIWA_ANTREAN_BERUBAH, tangani);
    return () => { clearTimeout(timer); window.removeEventListener(PERISTIWA_ANTREAN_BERUBAH, tangani); };
}
