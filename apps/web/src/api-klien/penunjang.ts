import type {
  FilterRekapLab, HasilBuatOrderDto, HasilMasukan, MasterPemeriksaanDto, OrderLabKirim, OrderPenunjangDto, RekapLabDto, SpesimenMasukan, TarifLabDto,
} from '@klira/shared';
import { panggilApi } from './klien';

export type SaringanRekap = Partial<Pick<FilterRekapLab, 'status' | 'dari' | 'sampai'>> & { halaman: number; ukuran: number };

export function queryRekapLab(f: SaringanRekap): string {
  const q = new URLSearchParams({ halaman: String(f.halaman), ukuran: String(f.ukuran) });
  if (f.status) q.set('status', f.status);
  if (f.dari) q.set('dari', f.dari);
  if (f.sampai) q.set('sampai', f.sampai);
  return q.toString();
}

export const rekapLab = (f: SaringanRekap) => panggilApi<RekapLabDto>('GET', `/penunjang/rekap?${queryRekapLab(f)}`);

export function queryMaster(f: { cari?: string; aktif?: boolean }): string {
  const q = new URLSearchParams();
  if (f.cari?.trim()) q.set('cari', f.cari.trim());
  if (f.aktif !== undefined) q.set('aktif', String(f.aktif));
  return q.toString();
}
export const daftarMasterPemeriksaan = (f: { cari?: string; aktif?: boolean } = {}) => panggilApi<MasterPemeriksaanDto[]>('GET', `/penunjang/master?${queryMaster(f)}`);
export const tarifLab = () => panggilApi<TarifLabDto[]>('GET', '/penunjang/tarif');
export const buatMasterPemeriksaan = (m: Record<string, unknown>) => panggilApi<MasterPemeriksaanDto>('POST', '/penunjang/master', m);
export const ubahMasterPemeriksaan = (id: number, m: Record<string, unknown>) => panggilApi<MasterPemeriksaanDto>('PATCH', `/penunjang/master/${id}`, m);

export const ordersKunjungan = (kunjunganId: number) => panggilApi<OrderPenunjangDto[]>('GET', `/kunjungan/${kunjunganId}/penunjang/order`);
export const buatOrderLab = (kunjunganId: number, m: OrderLabKirim) => panggilApi<HasilBuatOrderDto>('POST', `/kunjungan/${kunjunganId}/penunjang/order`, m);
export const ambilSpesimen = (orderId: number, m: Pick<SpesimenMasukan, 'asal'> & { waktu_ambil: string; petugas_id?: number }) =>
  panggilApi<OrderPenunjangDto>('POST', `/penunjang/order/${orderId}/spesimen`, m);
export const isiHasilLab = (orderId: number, m: Pick<HasilMasukan, 'nilai' | 'interpretasi' | 'catatan'>) => panggilApi<OrderPenunjangDto>('PUT', `/penunjang/order/${orderId}/hasil`, m);
export const validasiHasilLab = (orderId: number) => panggilApi<OrderPenunjangDto>('POST', `/penunjang/order/${orderId}/validasi`);
