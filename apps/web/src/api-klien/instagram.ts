import type { InfoKontakWaDto, KoneksiInstagramDto, PercakapanInstagramDto, PesanWaDto } from '@klira/shared';
import { panggilApi } from './klien';
export const koneksiWa = () => panggilApi<KoneksiInstagramDto>('GET', '/instagram/koneksi');
export const aksiKoneksiWa = (aksi: 'hubungkan' | 'putuskan') => panggilApi('POST', '/instagram/koneksi', { aksi });
export const percakapanWa = (halaman = 1) =>
  panggilApi<PercakapanInstagramDto[]>('GET', `/instagram/percakapan?halaman=${halaman}`);
export const ringkasanWa = () => panggilApi<{ belum_dibaca: number; terbaru: number }>('GET', '/instagram/ringkasan');
export const pesanWa = (id: number) => panggilApi<PesanWaDto[]>('GET', `/instagram/percakapan/${id}/pesan`);
export const bacaWa = (id: number, pesan_id: number) =>
  panggilApi('POST', `/instagram/percakapan/${id}/baca`, { pesan_id });
export const kirimWa = (id: number, teks: string, media?: { base64: string; mime: string; nama: string }) =>
  panggilApi('POST', `/instagram/percakapan/${id}/pesan`, { teks, media });
export const ubahWa = (id: number, data: { penanggung_jawab?: number | null; pasien_id?: number }) =>
  panggilApi('PATCH', `/instagram/percakapan/${id}`, data);
export const infoKontakWa = (id: number) => panggilApi<InfoKontakWaDto>('GET', `/instagram/percakapan/${id}/info`);
