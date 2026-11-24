import { token } from './token.js';
/**
 * Pembantu gaya inline untuk tata letak dan teks yang berulang. Tiap pembantu menerapkan persis properti yang sama
 * dengan blok Object.assign(el.style, {...}) yang digantikannya, dan mengembalikan objek style seperti Object.assign.
 */
/** Kolom flex dengan jarak antaranak (kunci token.jarak: xs, sm, md, lg, xl). */
export const kolomFleks = (el, jarak = 'md') => Object.assign(el.style, { display: 'flex', flexDirection: 'column', gap: token.jarak[jarak] });
/** Baris flex: `rata` (align-items), `bungkus` (flex-wrap), `sebar` (justify-content: space-between), `tambahan` (properti ekstra). */
export function barisFleks(el, jarak = 'sm', { rata, bungkus = false, sebar = false, tambahan } = {}) {
    return Object.assign(el.style, {
        display: 'flex',
        gap: token.jarak[jarak],
        ...(rata ? { alignItems: rata } : {}),
        ...(bungkus ? { flexWrap: 'wrap' } : {}),
        ...(sebar ? { justifyContent: 'space-between' } : {}),
        ...tambahan,
    });
}
/** Teks sekunder berukuran kecil. */
export const teksRedupKecil = (el) => Object.assign(el.style, { color: token.warna.teksRedup, fontSize: token.huruf.ukuran.kecil });
/** Judul seksi tebal tanpa margin; `ukuran` adalah kunci token.huruf.ukuran (besar, judul, halaman), `tumbuh` menambah flex-grow. */
export const judulTebal = (el, ukuran, tumbuh = false) => Object.assign(el.style, {
    ...(tumbuh ? { flexGrow: '1' } : {}),
    fontSize: token.huruf.ukuran[ukuran],
    fontWeight: token.huruf.berat.tebal,
    margin: '0',
});
