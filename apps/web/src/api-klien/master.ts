import type { BarisMaster, FilterMaster, Halaman, JenisMaster, JenisMasterUbah, OpsiMasterDto, ProfilKlinikDto, ProfilKlinikMasukan, RiwayatProfilDto, SumberOpsiMaster } from '@klira/shared';
import { panggilApi } from './klien';

export type SaringanMaster = { halaman: number; ukuran: number; cari?: string; status?: string; tingkat?: string };

export function queryMaster(f: SaringanMaster): string {
  const q = new URLSearchParams({ halaman: String(f.halaman), ukuran: String(f.ukuran) });
  if (f.cari) q.set('cari', f.cari);
  if (f.status && f.status !== 'semua') q.set('status', f.status);
  if (f.tingkat) q.set('tingkat', f.tingkat);
  return q.toString();
}

export const daftarMaster = (jenis: JenisMaster, f: SaringanMaster) => panggilApi<Halaman<BarisMaster>>('GET', `/master/${jenis}?${queryMaster(f)}`);
export const opsiMaster = (sumber: SumberOpsiMaster) => panggilApi<OpsiMasterDto[]>('GET', `/master/opsi/${sumber}`);
export const buatMaster = (jenis: JenisMasterUbah, m: Record<string, unknown>) => panggilApi<BarisMaster>('POST', `/master/${jenis}`, m);
export const ubahMaster = (jenis: JenisMasterUbah, id: number, m: Record<string, unknown>) => panggilApi<BarisMaster>('PATCH', `/master/${jenis}/${id}`, m);
export const ubahAktifMaster = (jenis: JenisMasterUbah, id: number, aktif: boolean) => panggilApi<BarisMaster>('PATCH', `/master/${jenis}/${id}/aktif`, { aktif });

export const ambilProfilKlinik = () => panggilApi<ProfilKlinikDto>('GET', '/fasyankes/profil');
export const simpanProfilKlinik = (m: ProfilKlinikMasukan | Record<string, unknown>) => panggilApi<ProfilKlinikDto>('PATCH', '/fasyankes/profil', m);
export const daftarRiwayatProfil = (halaman: number, ukuran: number) => panggilApi<Halaman<RiwayatProfilDto>>('GET', `/fasyankes/riwayat-profil?halaman=${halaman}&ukuran=${ukuran}`);

export type { FilterMaster };
