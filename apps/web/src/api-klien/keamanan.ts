import type { Halaman, PengaturanKeamananDto, PengaturanKeamananMasukan, RiwayatBackupDto } from '@klira/shared';
import { GALAT } from '@klira/shared';
import { GalatApi, panggilApi } from './klien';

export const ambilPengaturanKeamanan = () => panggilApi<PengaturanKeamananDto>('GET', '/pengaturan-keamanan');
export const simpanPengaturanKeamanan = (m: PengaturanKeamananMasukan) => panggilApi<PengaturanKeamananDto>('PATCH', '/pengaturan-keamanan', m);
export const daftarRiwayatBackup = (halaman: number, ukuran: number) =>
  panggilApi<Halaman<RiwayatBackupDto>>('GET', `/riwayat-backup?halaman=${halaman}&ukuran=${ukuran}`);

export const resetSistem = () => panggilApi<{ ok: true }>('POST', '/cadangan/reset', { konfirmasi: 'RESET' });
export const alamatUnduhBackup = '/api/cadangan/unduh';
export async function unggahBackup(berkas: File): Promise<void> {
  let res: Response;
  try {
    res = await fetch('/api/cadangan/pulihkan', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/octet-stream' }, body: berkas });
  } catch {
    throw new GalatApi(0, GALAT.jaringan);
  }
  if (!res.ok) {
    const isi = (await res.json().catch(() => null)) as { galat?: { pesan?: string } } | null;
    throw new GalatApi(res.status, isi?.galat?.pesan ?? GALAT.umum);
  }
}
