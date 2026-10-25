import type { FilterPengguna, Halaman, PenggunaDaftarDto } from '@klira/shared';
import { panggilApi } from './klien';

type MasukanDaftar = Pick<FilterPengguna, 'halaman' | 'ukuran'> & Partial<Pick<FilterPengguna, 'cari' | 'status' | 'jenis_akun_id'>>;

export function queryDaftarPengguna(f: MasukanDaftar): string {
  const q = new URLSearchParams({ halaman: String(f.halaman), ukuran: String(f.ukuran) });
  if (f.cari) q.set('cari', f.cari);
  if (f.status && f.status !== 'semua') q.set('status', f.status);
  if (f.jenis_akun_id) q.set('jenis_akun_id', String(f.jenis_akun_id));
  return q.toString();
}

export const daftarPengguna = (f: MasukanDaftar) =>
  panggilApi<Halaman<PenggunaDaftarDto>>('GET', `/pengguna?${queryDaftarPengguna(f)}`);

export const ubahAktifPengguna = (id: number, aktif: boolean) =>
  panggilApi<{ id: number; aktif: boolean }>('PATCH', `/pengguna/${id}`, { aktif });
