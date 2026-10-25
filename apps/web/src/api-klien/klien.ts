import { GALAT } from '@klira/shared';
import type { PeringatanTerdeteksi, ResponsGalat } from '@klira/shared';

export class GalatApi extends Error {
  constructor(
    public status: number,
    message: string,
    public peringatan?: PeringatanTerdeteksi[],
    public kode?: string,
  ) {
    super(message);
  }
}

/** Pemanggil API dasar: JSON, cookie sesi ikut terkirim, galat dipetakan ke GalatApi. */
export async function panggilApi<T>(
  metode: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  jalur: string,
  badan?: unknown,
  ambil: typeof fetch = fetch,
): Promise<T> {
  let res: Response;
  try {
    res = await ambil(`/api${jalur}`, {
      method: metode,
      credentials: 'same-origin',
      headers: badan === undefined ? undefined : { 'content-type': 'application/json' },
      body: badan === undefined ? undefined : JSON.stringify(badan),
    });
  } catch {
    throw new GalatApi(0, GALAT.jaringan);
  }
  const isi = (await res.json().catch(() => null)) as ({ data?: T } & Partial<ResponsGalat>) | null;
  if (!res.ok) throw new GalatApi(res.status, isi?.galat?.pesan ?? GALAT.umum, isi?.galat?.peringatan, isi?.galat?.kode);
  return isi?.data as T;
}
