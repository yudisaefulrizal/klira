import type {
  AnggotaKeluargaDto, BagianKlinis, BagianKlinisDto, BagianTemplat, FavoritDto, FolderKeluargaDto, JenisFavorit, KlinisKunjunganDto, KodeTerminologiDto, KonteksKlinisDto,
  KunjunganDto, RiwayatKunjunganDto, SalinanKunjunganDto, SistemTerminologi, TemplatDto, TemplatMasukan,
} from '@klira/shared';
import { panggilApi } from './klien';

export type HasilSimpanBagian = { bagian: BagianKlinisDto; kunjungan: KunjunganDto; tersimpan: boolean };

export const ambilKlinis = (kunjunganId: number) => panggilApi<KlinisKunjunganDto>('GET', `/kunjungan/${kunjunganId}/klinis`);
export const ambilKonteksKlinis = (kunjunganId: number) => panggilApi<KonteksKlinisDto>('GET', `/kunjungan/${kunjunganId}/konteks-klinis`);
/** Simpan satu bagian = pengesahan; `alasan` wajib bila bagian itu sudah disahkan. */
export const simpanBagian = (kunjunganId: number, bagian: BagianKlinis, isi: unknown, alasan?: string) =>
  panggilApi<HasilSimpanBagian>('PUT', `/kunjungan/${kunjunganId}/klinis/${bagian}`, { isi, ...(alasan?.trim() ? { alasan: alasan.trim() } : {}) });
export const selesaikanPemeriksaan = (kunjunganId: number, tahap: 'resep' | 'kasir' = 'kasir') =>
  panggilApi<KunjunganDto>('POST', `/kunjungan/${kunjunganId}/klinis/selesai`, { tahap });
export const riwayatKunjungan = (pasienId: number, kecualiKunjunganId?: number) =>
  panggilApi<RiwayatKunjunganDto[]>('GET', `/pasien/${pasienId}/riwayat-kunjungan${kecualiKunjunganId ? `?kecuali=${kecualiKunjunganId}` : ''}`);
export const salinanKunjungan = (kunjunganId: number, sumberId: number) => panggilApi<SalinanKunjunganDto>('GET', `/kunjungan/${kunjunganId}/salinan/${sumberId}`);

export const cariTerminologi = (sistem: SistemTerminologi, q: string, batas = 10) =>
  panggilApi<KodeTerminologiDto[]>('GET', `/terminologi?${new URLSearchParams({ sistem, q, batas: String(batas) }).toString()}`);

export const daftarFavorit = (jenis?: JenisFavorit) => panggilApi<FavoritDto[]>('GET', `/favorit${jenis ? `?jenis=${jenis}` : ''}`);
export const tambahFavorit = (m: { jenis: JenisFavorit; kode: string; nama: string }) => panggilApi<FavoritDto>('POST', '/favorit', m);
export const ubahUrutanFavorit = (id: number, urutan: number) => panggilApi<FavoritDto>('PATCH', `/favorit/${id}`, { urutan });
export const hapusFavorit = (id: number) => panggilApi<{ id: number }>('DELETE', `/favorit/${id}`);

export const daftarTemplat = (bagian?: BagianTemplat) => panggilApi<TemplatDto[]>('GET', `/templat-catatan${bagian ? `?bagian=${bagian}` : ''}`);
export const tambahTemplat = (m: TemplatMasukan) => panggilApi<TemplatDto>('POST', '/templat-catatan', m);
export const hapusTemplat = (id: number) => panggilApi<{ id: number }>('DELETE', `/templat-catatan/${id}`);

export const ambilFolderKeluarga = (pasienId: number) => panggilApi<FolderKeluargaDto>('GET', `/pasien/${pasienId}/keluarga`);
export const tautkanKeluarga = (pasienId: number, m: { anggota_pasien_id: number; hubungan: string }) => panggilApi<AnggotaKeluargaDto>('POST', `/pasien/${pasienId}/keluarga`, m);
export const ubahKeluarga = (pasienId: number, id: number, m: { hubungan?: string; dibatasi?: boolean }) => panggilApi<AnggotaKeluargaDto>('PATCH', `/pasien/${pasienId}/keluarga/${id}`, m);
