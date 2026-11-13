/** Halaman yang memuat tab kelola master; terbuka bagi pemegang izin master walau tanpa akses klinis (tab operasionalnya tersembunyi). */
export const HALAMAN_KELOLA_MASTER = ['/pasien', '/rawat-inap', '/kasir-klaim'];
export function jenisMasterDiHalaman(search, daftar) {
    const jenis = new URLSearchParams(search).get('jenis');
    return daftar.find(j => j === jenis) ?? daftar[0] ?? 'poli';
}
