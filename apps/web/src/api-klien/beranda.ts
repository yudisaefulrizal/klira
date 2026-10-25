import type { RingkasanPdpDto } from '@klira/shared';
import { panggilApi } from './klien';

export const ambilRingkasanPdp = () => panggilApi<RingkasanPdpDto>('GET', '/pdp/ringkasan');
