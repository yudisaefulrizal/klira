import type {
  FilterMasterObat, FilterRiwayatObat, HalamanMasterObatDto, HasilBuatResepDto, HasilSiapDto, MasterObatDto, MutasiStokDto, ReferensiKfaDto, ResepDto, RiwayatObatDto, StokObatDto, TelaahMasukan,
} from '@klira/shared';
import { panggilApi } from './klien';

export function queryMasterObat(f: Partial<FilterMasterObat>): string {
  const q = new URLSearchParams();
  if (f.cari?.trim()) q.set('cari', f.cari.trim());
  if (f.aktif !== undefined) q.set('aktif', String(f.aktif));
  if (f.halaman) q.set('halaman', String(f.halaman));
  if (f.ukuran) q.set('ukuran', String(f.ukuran));
  return q.toString();
}
export const cariKfa = (cari: string) => panggilApi<ReferensiKfaDto[]>('GET', `/farmasi/kfa?${new URLSearchParams({ cari: cari.trim() }).toString()}`);
export const daftarMasterObat = (f: Partial<FilterMasterObat> = {}) => panggilApi<HalamanMasterObatDto>('GET', `/farmasi/master?${queryMasterObat(f)}`);
export const buatMasterObat = (m: Record<string, unknown>) => panggilApi<MasterObatDto>('POST', '/farmasi/master', m);
export const ubahMasterObat = (id: number, m: Record<string, unknown>) => panggilApi<MasterObatDto>('PATCH', `/farmasi/master/${id}`, m);
export const stokObat = (id: number) => panggilApi<{ stok: StokObatDto[]; mutasi: MutasiStokDto[] }>('GET', `/farmasi/master/${id}/stok`);
export const catatMutasiStok = (m: Record<string, unknown>) => panggilApi<StokObatDto>('POST', '/farmasi/mutasi', m);

export function queryRiwayatObat(f: Partial<FilterRiwayatObat>): string {
  const q = new URLSearchParams({ halaman: String(f.halaman ?? 1), ukuran: String(f.ukuran ?? 20) });
  if (f.status) q.set('status', f.status);
  if (f.dari) q.set('dari', f.dari);
  if (f.sampai) q.set('sampai', f.sampai);
  return q.toString();
}
export const riwayatObat = (f: Partial<FilterRiwayatObat>) => panggilApi<RiwayatObatDto>('GET', `/farmasi/riwayat?${queryRiwayatObat(f)}`);

export const resepKunjungan = (kunjunganId: number) => panggilApi<ResepDto[]>('GET', `/kunjungan/${kunjunganId}/resep`);
export const buatResep = (kunjunganId: number, m: { item: Record<string, unknown>[] }) => panggilApi<HasilBuatResepDto>('POST', `/kunjungan/${kunjunganId}/resep`, m);
export const telaahResep = (resepId: number, m: TelaahMasukan) => panggilApi<ResepDto>('POST', `/resep/${resepId}/telaah`, m);
export const siapkanResep = (resepId: number) => panggilApi<HasilSiapDto>('POST', `/resep/${resepId}/siap`);
