import { PENUNJANG } from '@klira/shared';
import type { OrderPenunjangDto } from '@klira/shared';
import { dariInputLokal, keInputLokal } from './keadaan-pemeriksaan';

/** Keadaan Ambil spesimen (MODAL-1): order terpilih (satu pengambilan untuk beberapa pemeriksaan), asal, waktu, petugas. */
export type KeadaanSpesimen = { terpilih: number[]; asal: string; waktu: string; petugas: string };

/** Order yang masih menunggu spesimen. */
export const menungguSpesimen = (orders: readonly OrderPenunjangDto[]): OrderPenunjangDto[] => orders.filter((o) => o.status === 'dipesan');

export function awalSpesimen(orders: readonly OrderPenunjangDto[], sekarang: Date = new Date()): KeadaanSpesimen {
  const menunggu = menungguSpesimen(orders);
  return { terpilih: menunggu.map((o) => o.id), asal: menunggu[0]?.jenis_spesimen ?? '', waktu: keInputLokal(sekarang.toISOString()), petugas: '' };
}

/** Memilih order mengisi asal dari jenis spesimen pemeriksaan pertama bila asal masih kosong. */
export function gantiOrderSpesimen(k: KeadaanSpesimen, orders: readonly OrderPenunjangDto[], id: number): KeadaanSpesimen {
  const terpilih = k.terpilih.includes(id) ? k.terpilih.filter((x) => x !== id) : [...k.terpilih, id];
  const asal = k.asal.trim() ? k.asal : (orders.find((o) => o.id === terpilih[0])?.jenis_spesimen ?? '');
  return { ...k, terpilih, asal };
}

export function galatSpesimen(k: KeadaanSpesimen): Record<string, string> {
  const g: Record<string, string> = {};
  if (!k.terpilih.length) g.terpilih = PENUNJANG.galat.pilihOrder;
  if (!k.asal.trim()) g.asal = PENUNJANG.galat.asalWajib;
  if (!dariInputLokal(k.waktu)) g.waktu = PENUNJANG.galat.waktuWajib;
  else if (new Date(dariInputLokal(k.waktu)).getTime() > Date.now() + 5 * 60_000) g.waktu = PENUNJANG.galat.waktuMasaDepan;
  return g;
}

export const bentukSpesimen = (k: KeadaanSpesimen) => ({
  asal: k.asal.trim(), waktu_ambil: dariInputLokal(k.waktu), ...(k.petugas ? { petugas_id: Number(k.petugas) } : {}),
});
