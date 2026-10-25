import type { AksiAntrean, AntreanDto, KunjunganDto, KunjunganKirim, OpsiKunjunganDto } from '@klira/shared';
import { panggilApi } from './klien';

export const opsiKunjungan = () => panggilApi<OpsiKunjunganDto>('GET', '/kunjungan/opsi');
export const daftarkanKunjungan = (m: KunjunganKirim) => panggilApi<KunjunganDto>('POST', '/kunjungan', m);
/** Panggil, mulai, selesai, atau batalkan antrean. */
export const aksiAntrean = (id: number, aksi: AksiAntrean) => panggilApi<AntreanDto>('POST', `/antrean/${id}/${aksi}`);
