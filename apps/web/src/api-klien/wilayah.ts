import type { HasilCariWilayah, WilayahDto } from '@klira/shared';
import { panggilApi } from './klien';

export const cariWilayah = (kata: string) => panggilApi<HasilCariWilayah>('GET', `/wilayah?cari=${encodeURIComponent(kata)}`);
const cache = new Map<string, WilayahDto>();
export function ingatWilayah(w: WilayahDto) { cache.set(w.kode, w); }
export async function ambilWilayah(kode: string): Promise<WilayahDto> {
  const ada = cache.get(kode);
  if (ada) return ada;
  const w = await panggilApi<WilayahDto>('GET', `/wilayah/${encodeURIComponent(kode)}`);
  ingatWilayah(w);
  return w;
}
