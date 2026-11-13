import { buatNavigasi, ruteDokumenNative } from './navigasi-native.js';
import { bukaLapisanRiwayat } from './riwayat-lapisan.js';
export const navigasi = buatNavigasi(window, ruteDokumenNative);
export const navigasiSaatIni = () => ({ ...navigasi.potret(), pindah: navigasi.pindah, ganti: navigasi.ganti });
export const pasangLapisanRiwayat = (terbuka, onKembali) => terbuka ? bukaLapisanRiwayat(window, onKembali) : () => {};
