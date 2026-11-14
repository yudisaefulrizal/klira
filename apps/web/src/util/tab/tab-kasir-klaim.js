import { punyaIzin } from '@klira/shared';
export const TAB_KASIR_KLAIM = [
    { id: 'shift', label: 'Shift dan rekap harian', izin: ['kasir', 'lihat'] },
    { id: 'hasil', label: 'Hasil lab', izin: ['kasir', 'lihat'] },
    { id: 'klaim', label: 'Klaim JKN/BPJS', izin: ['klaim', 'lihat'] },
    { id: 'tarif', label: 'Tarif layanan', izin: ['master', 'lihat'] },
];
/** Tab halaman Kasir dan klaim yang boleh dilihat (5.1m): Shift untuk kasir, Klaim untuk petugas klaim, Tarif untuk pengelola master. */
export function tabKasirKlaimDiizinkan(pengguna) {
    return TAB_KASIR_KLAIM.filter((t) => punyaIzin(pengguna, t.izin[0], t.izin[1]));
}
