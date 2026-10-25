import { GALAT } from '@klira/shared';
import type { CatatanAuditDto, EksporAudit, FilterAudit, Halaman } from '@klira/shared';
import { GalatApi, panggilApi } from './klien';

export type SaringanAudit = Partial<Omit<FilterAudit, 'dari' | 'sampai'>> & { dari?: string; sampai?: string };

const qs = (f: Record<string, unknown>) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) if (v !== undefined && v !== '') p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : '';
};

export const daftarAudit = (f: SaringanAudit = {}) => panggilApi<Halaman<CatatanAuditDto>>('GET', `/audit${qs(f)}`);
export const detailAudit = (id: number) => panggilApi<CatatanAuditDto>('GET', `/audit/${id}`);

/** Ekspor CSV; mengembalikan isi CSV (peladen mencatatnya sebagai aksi ekspor). */
export async function eksporAudit(f: Partial<Omit<EksporAudit, 'dari' | 'sampai'>> & { dari?: string; sampai?: string } = {}, ambil: typeof fetch = fetch): Promise<string> {
  let res: Response;
  try {
    res = await ambil('/api/audit/ekspor', {
      method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify(f),
    });
  } catch {
    throw new GalatApi(0, GALAT.jaringan);
  }
  if (!res.ok) {
    const isi = (await res.json().catch(() => null)) as { galat?: { pesan?: string; kode?: string } } | null;
    throw new GalatApi(res.status, isi?.galat?.pesan ?? GALAT.umum, undefined, isi?.galat?.kode);
  }
  return res.text();
}
