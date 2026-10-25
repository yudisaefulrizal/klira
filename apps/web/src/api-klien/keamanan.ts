import type { Halaman, PengaturanKeamananDto, PengaturanKeamananMasukan, RiwayatBackupDto } from '@klira/shared';
import { panggilApi } from './klien';

export const ambilPengaturanKeamanan = () => panggilApi<PengaturanKeamananDto>('GET', '/pengaturan-keamanan');
export const simpanPengaturanKeamanan = (m: PengaturanKeamananMasukan) => panggilApi<PengaturanKeamananDto>('PATCH', '/pengaturan-keamanan', m);
export const daftarRiwayatBackup = (halaman: number, ukuran: number) =>
  panggilApi<Halaman<RiwayatBackupDto>>('GET', `/riwayat-backup?halaman=${halaman}&ukuran=${ukuran}`);
