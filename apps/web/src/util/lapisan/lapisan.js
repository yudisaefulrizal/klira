let tumpukan = [];
const pendengar = new Set();
const beri = () => pendengar.forEach((p) => p());
export function masukLapisan(id) {
    if (!tumpukan.includes(id))
        tumpukan = [...tumpukan, id];
    beri();
}
export function keluarLapisan(id) {
    tumpukan = tumpukan.filter((x) => x !== id);
    beri();
}
export const lapisanAtas = () => tumpukan[tumpukan.length - 1] ?? null;
export const adaLapisan = () => tumpukan.length > 0;
/** Murni: apakah lapisan `id` harus inert pada tumpukan tertentu. Lapisan yang belum terdaftar (render pertama) dianggap teratas. */
export const inertDalam = (daftar, id) => daftar.includes(id) && daftar[daftar.length - 1] !== id;
export const adalahInert = (id) => inertDalam(tumpukan, id);
export const adalahAtas = (id) => lapisanAtas() === id;
export function langgananLapisan(p) {
    pendengar.add(p);
    return () => void pendengar.delete(p);
}
/** Tanda tangan keadaan untuk useSyncExternalStore. */
export const potretLapisan = () => tumpukan.join('|');
export function setelUlangLapisan() {
    tumpukan = [];
    beri();
}
let kunciAktif = 0;
let guliranAsli = '';
/**
 * Kunci gulir halaman selama ada lapisan terbuka. Nilai `overflow` asli dicatat sekali oleh pengunci pertama dan
 * dipulihkan setelah pengunci terakhir melepas, apa pun urutan pelepasannya (modal dan konfirmasi di atasnya boleh
 * dilepas dalam urutan berbeda). Mengembalikan fungsi pelepas, aman dipanggil dua kali.
 */
export function kunciGuliran(target) {
    if (kunciAktif === 0)
        guliranAsli = target.overflow;
    kunciAktif += 1;
    target.overflow = 'hidden';
    let lepas = false;
    return () => {
        if (lepas)
            return;
        lepas = true;
        kunciAktif -= 1;
        if (kunciAktif === 0)
            target.overflow = guliranAsli;
    };
}
/** Hanya untuk uji. */
export function setelUlangKunciGuliran() {
    kunciAktif = 0;
    guliranAsli = '';
}
/**
 * Murni: ke mana fokus dikembalikan saat sebuah lapisan keluar.
 * `lapisanPemicu` = id lapisan yang memuat pemicu (null bila di luar semua lapisan), `atasSetelah` = lapisan teratas sesudah keluar.
 */
export function pilihTargetPemulihan(pemicuAda, lapisanPemicu, atasSetelah) {
    if (!atasSetelah)
        return pemicuAda ? 'pemicu' : 'tidak';
    if (pemicuAda && lapisanPemicu === atasSetelah)
        return 'pemicu';
    return 'pertamaAtas';
}
