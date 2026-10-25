import { z } from 'zod';
import type { StatusPengesahan } from '../status';
import type { PengesahanDto } from './klinis';

/** Entitas yang boleh diberi addendum; CPPT dan resume menambah nilai di sini ketika dikerjakan. */
export const ENTITAS_ADDENDUM = ['hasil_penunjang'] as const;
export type EntitasAddendum = (typeof ENTITAS_ADDENDUM)[number];
export const entitasAddendum = z.enum(ENTITAS_ADDENDUM);

/** Addendum (4.2): isi susulan setelah catatan disahkan. Tidak menimpa; punya pengesahan sendiri dan penanda kirim ulang (7). */
export type AddendumDto = {
  id: number;
  kunjungan_id: number;
  entitas: string;
  entitas_id: number;
  versi: number;
  isi: Record<string, unknown>;
  alasan: string;
  waktu: string;
  dibuat_oleh_nama: string | null;
  perlu_kirim_ulang: boolean;
  dikirim_pada: string | null;
  pengesahan: PengesahanDto | null;
  verifikasi: StatusPengesahan;
};
