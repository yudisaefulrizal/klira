import type { PenggunaSaya } from '@klira/shared';
import { GalatApi, panggilApi } from './klien';

export const masuk = (username: string, kata_sandi: string) =>
  panggilApi<PenggunaSaya>('POST', '/masuk', { username, kata_sandi });

export const keluar = () => panggilApi<{ ok: true }>('POST', '/keluar', {});

/** Pengguna saat ini, atau null bila belum masuk. */
export async function ambilSaya(): Promise<PenggunaSaya | null> {
  try {
    return await panggilApi<PenggunaSaya>('GET', '/saya');
  } catch (galat) {
    if (galat instanceof GalatApi && galat.status === 401) return null;
    throw galat;
  }
}
