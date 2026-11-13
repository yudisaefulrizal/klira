import { buatNavigasi, ruteDokumenNative } from './mesin-navigasi.js';
import { bukaLapisanRiwayat } from '../lapisan/riwayat-lapisan.js';
export const navigasi = buatNavigasi(window, ruteDokumenNative);
export const navigasiSaatIni = () => ({ ...navigasi.potret(), pindah: navigasi.pindah, ganti: navigasi.ganti });
export const pasangLapisanRiwayat = (terbuka, onKembali) => terbuka ? bukaLapisanRiwayat(window, onKembali) : () => {};
