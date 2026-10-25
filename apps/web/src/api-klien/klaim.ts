import type { HalamanKlaimDto, KandidatKlaimDto, KlaimDto, KodeKlaim, SiapkanKlaimForm, UbahBerkasKlaimForm, UbahStatusKlaimForm } from '@klira/shared';
import { panggilApi } from './klien';

export function queryKlaim(f: { status?: string; cari?: string; halaman?: number; ukuran?: number }): string {
  const q = new URLSearchParams({ halaman: String(f.halaman ?? 1), ukuran: String(f.ukuran ?? 20) });
  if (f.status) q.set('status', f.status);
  if (f.cari?.trim()) q.set('cari', f.cari.trim());
  return q.toString();
}
export const daftarKlaim = (f: { status?: string; cari?: string; halaman?: number; ukuran?: number }) => panggilApi<HalamanKlaimDto>('GET', `/klaim?${queryKlaim(f)}`);
export const kandidatKlaim = () => panggilApi<KandidatKlaimDto[]>('GET', '/klaim/kandidat');
export const kodeKlaimKunjungan = (kunjunganId: number) => panggilApi<{ diagnosis: KodeKlaim[]; tindakan: KodeKlaim[]; final: boolean }>('GET', `/klaim/kode/${kunjunganId}`);
export const ambilKlaim = (id: number) => panggilApi<KlaimDto>('GET', `/klaim/${id}`);
export const siapkanKlaim = (m: SiapkanKlaimForm) => panggilApi<KlaimDto>('POST', '/klaim', m);
export const ubahBerkasKlaim = (id: number, m: UbahBerkasKlaimForm) => panggilApi<KlaimDto>('PUT', `/klaim/${id}/berkas`, m);
export const ubahStatusKlaim = (id: number, m: UbahStatusKlaimForm) => panggilApi<KlaimDto>('POST', `/klaim/${id}/status`, m);
