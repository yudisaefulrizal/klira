import type { BagianKlinis, FilterBerkas, FilterPerbaikan, HalamanBerkasDto, HalamanPerbaikanDto, HasilPerbaikanDto, PengkodeanDto, PengkodeanMasukan, PermintaanPerbaikanDto } from '@klira/shared';
import { panggilApi } from './klien';

export function queryBerkas(f: Partial<FilterBerkas>): string {
  const q = new URLSearchParams({ halaman: String(f.halaman ?? 1), ukuran: String(f.ukuran ?? 20) });
  if (f.cari?.trim()) q.set('cari', f.cari.trim());
  if (f.kode) q.set('kode', f.kode);
  if (f.dari) q.set('dari', f.dari);
  if (f.sampai) q.set('sampai', f.sampai);
  return q.toString();
}
export const daftarBerkas = (f: Partial<FilterBerkas>) => panggilApi<HalamanBerkasDto>('GET', `/rekam-medis/berkas?${queryBerkas(f)}`);

export const ajukanPerbaikan = (kunjunganId: number, m: { bagian: BagianKlinis; isi: unknown; alasan: string }) => panggilApi<HasilPerbaikanDto>('POST', `/kunjungan/${kunjunganId}/perbaikan`, m);
export function queryPerbaikan(f: Partial<FilterPerbaikan>): string {
  const q = new URLSearchParams({ halaman: String(f.halaman ?? 1), ukuran: String(f.ukuran ?? 20) });
  if (f.status) q.set('status', f.status);
  return q.toString();
}
export const daftarPerbaikan = (f: Partial<FilterPerbaikan>) => panggilApi<HalamanPerbaikanDto>('GET', `/rekam-medis/perbaikan?${queryPerbaikan(f)}`);
export const putuskanPerbaikan = (id: number, m: { keputusan: 'setujui' | 'tolak'; catatan?: string }) => panggilApi<PermintaanPerbaikanDto>('POST', `/rekam-medis/perbaikan/${id}/keputusan`, m);

export const ambilPengkodean = (kunjunganId: number) => panggilApi<PengkodeanDto>('GET', `/kunjungan/${kunjunganId}/pengkodean`);
export const simpanPengkodean = (kunjunganId: number, m: PengkodeanMasukan) => panggilApi<PengkodeanDto>('PUT', `/kunjungan/${kunjunganId}/pengkodean`, m);
