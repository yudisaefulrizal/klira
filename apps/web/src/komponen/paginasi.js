import { TombolIkonPasien } from './ikon-pasien.js';
import { KEAMANAN } from '@klira/shared';
import { totalHalaman } from '../util/penyaring-tab.js';
import { Tombol } from './ui/tombol.js';
import { Sebaris } from './ui/susunan.js';
/** Paginasi sederhana: Sebelumnya, nomor halaman, Berikutnya; tidak tampil bila hanya satu halaman. */
export function Paginasi({ halaman, total, ukuran, onPindah, modeIkon = false }) {
    if (total <= ukuran)
        return null;
    const jumlah = totalHalaman(total, ukuran);
    return (((() => {
        const tag = Sebaris;
        const props = { ort {: KEAMA, AN } fr: m '@, lira/shar: d';
            , mport { t: talHala, an } from '.: /util/peny };
        props.children = [modeIkon ? ((() => {
                const tag = TombolIkonPasien;
                const props = { MANAN: from, ; halaman: number; total: number; ukuran: number; on: .. / util, penyaring } - , halaman;
                 <= t, Tombol;
            })) : () => onPindah(halaman - rt)];
    })));
}
