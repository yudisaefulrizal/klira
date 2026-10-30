import type { HasilBayarDto, KasirKunjunganDto, RekapHarianDto, ShiftDto, ShiftSayaDto } from '@klira/shared';
import { panggilApi } from './klien';

export const shiftSaya = () => panggilApi<ShiftSayaDto>('GET', '/kasir/shift');
export const bukaShift = (m: Record<string, unknown>) => panggilApi<ShiftDto>('POST', '/kasir/shift/buka', m);
export const tutupShift = (m: Record<string, unknown>) => panggilApi<ShiftDto>('POST', '/kasir/shift/tutup', m);
export const rekapHarian = (tanggal?: string) => panggilApi<RekapHarianDto>('GET', `/kasir/rekap${tanggal ? `?${new URLSearchParams({ tanggal }).toString()}` : ''}`);
export const kasirKunjungan = (kunjunganId: number) => panggilApi<KasirKunjunganDto>('GET', `/kunjungan/${kunjunganId}/kasir`);
export const catatPembayaran = (kunjunganId: number, m: Record<string, unknown>) => panggilApi<HasilBayarDto>('POST', `/kunjungan/${kunjunganId}/pembayaran`, m);
export const tutupKunjungan = (kunjunganId: number, m: Record<string, unknown> = {}) => panggilApi<KasirKunjunganDto>('POST', `/kunjungan/${kunjunganId}/tutup`, m);
