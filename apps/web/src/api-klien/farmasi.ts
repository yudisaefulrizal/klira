import type {
  HasilSerahTerimaDto, FilterMasterObat, FilterRiwayatObat, HalamanMasterObatDto, HasilBuatResepDto, HasilSiapDto, MasterObatDto, MutasiStokDto, ReferensiKfaDto, ResepDto, RiwayatObatDto, StokObatDto, TelaahKirim,
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
export const cariKfa = (cari: string, batas?: number) => panggilApi<ReferensiKfaDto[]>('GET', `/farmasi/kfa?${new URLSearchParams({ cari: cari.trim(), ...(batas ? { batas: String(batas) } : {}) }).toString()}`);
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
export const buatResep = (kunjunganId: number, m: { teks: string }) => panggilApi<HasilBuatResepDto>('POST', `/kunjungan/${kunjunganId}/resep`, m);
export const telaahResep = (resepId: number, m: TelaahKirim) => panggilApi<ResepDto>('POST', `/resep/${resepId}/telaah`, m);
export const siapkanResep = (resepId: number) => panggilApi<HasilSiapDto>('POST', `/resep/${resepId}/siap`);

export const serahkanObat = (kunjunganId: number, m: Record<string, unknown> = {}) => panggilApi<HasilSerahTerimaDto>('POST', `/kunjungan/${kunjunganId}/serah-terima-obat`, m);

/** Seluruh master obat aktif (dimuat per halaman 100) untuk pencarian obat di editor item resep. */
export async function semuaMasterObatAktif(): Promise<MasterObatDto[]> {
  const awal = await daftarMasterObat({ aktif: true, ukuran: 100 });
  const semua = [...awal.data];
  for (let halaman = 2; semua.length < awal.total; halaman++) {
    const h = await daftarMasterObat({ aktif: true, ukuran: 100, halaman });
    if (!h.data.length) break;
    semua.push(...h.data);
  }
  return semua;
}
