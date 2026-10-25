import type { AddendumDto } from '@klira/shared';
import { panggilApi } from './klien';

export const daftarAddendum = (kunjunganId: number) => panggilApi<AddendumDto[]>('GET', `/kunjungan/${kunjunganId}/addendum`);
