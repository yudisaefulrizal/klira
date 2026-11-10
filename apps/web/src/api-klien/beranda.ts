import type { KesiapanDto, RingkasanPdpDto } from '@klira/shared';
import { panggilApi } from './klien';

export const ambilRingkasanPdp = () => panggilApi<RingkasanPdpDto>('GET', '/pdp/ringkasan');
export const ambilKesiapan = () => panggilApi<KesiapanDto>('GET', '/master/kesiapan');
