import type { InfoKontakWaDto, KoneksiWaDto, PercakapanWaDto, PesanWaDto } from '@klira/shared';
import { panggilApi } from './klien';
export const koneksiWa = () => panggilApi<KoneksiWaDto>('GET', '/whatsapp/koneksi');
export const aksiKoneksiWa = (aksi: 'hubungkan' | 'putuskan') => panggilApi('POST', '/whatsapp/koneksi', { aksi });
export const percakapanWa = (halaman = 1) =>
  panggilApi<PercakapanWaDto[]>('GET', `/whatsapp/percakapan?halaman=${halaman}`);
export const ringkasanWa = () => panggilApi<{ belum_dibaca: number; terbaru: number }>('GET', '/whatsapp/ringkasan');
export const pesanWa = (id: number) => panggilApi<PesanWaDto[]>('GET', `/whatsapp/percakapan/${id}/pesan`);
export const bacaWa = (id: number, pesan_id: number) =>
  panggilApi('POST', `/whatsapp/percakapan/${id}/baca`, { pesan_id });
export const bukaWa = (nomor: string, pasien_id?: number) =>
  panggilApi<{ id: number }>('POST', '/whatsapp/percakapan', { nomor, pasien_id });
export const kirimWa = (id: number, teks: string, media?: { base64: string; mime: string; nama: string }) =>
  panggilApi('POST', `/whatsapp/percakapan/${id}/pesan`, { teks, media });
export const ubahWa = (id: number, data: { penanggung_jawab?: number | null; pasien_id?: number }) =>
  panggilApi('PATCH', `/whatsapp/percakapan/${id}`, data);
export const kontakPasienWa = (id: number) =>
  panggilApi<{ id: number; nama: string; nomor_hp: string | null; wali_keluarga: { nama: string; hubungan: string; kontak: string | null }[] }>(
    'GET',
    `/whatsapp/pasien/${id}`,
  );

export const infoKontakWa = (id: number) => panggilApi<InfoKontakWaDto>('GET', `/whatsapp/percakapan/${id}/info`);
