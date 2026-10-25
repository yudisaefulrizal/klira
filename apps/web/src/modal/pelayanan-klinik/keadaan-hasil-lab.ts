import { INTERPRETASI_HASIL, PENUNJANG, sarankanInterpretasi } from '@klira/shared';
import type { InterpretasiHasil, OrderPenunjangDto } from '@klira/shared';

/** Keadaan Hasil lab (MODAL-BERTAHAP: Hasil > Interpretasi > Validasi); kunci peta = id order sebagai teks. */
export type KeadaanHasilLab = {
  nilai: Record<string, string>;
  interpretasi: Record<string, string>;
  catatan: Record<string, string>;
  /** Validasi hasil sekaligus saat menyimpan (analis lain boleh memvalidasi kemudian bila dimatikan). */
  validasi: boolean;
};

/** Order yang menunggu hasil: spesimen sudah diambil, belum divalidasi. */
export const menungguHasil = (orders: readonly OrderPenunjangDto[]): OrderPenunjangDto[] => orders.filter((o) => o.status === 'spesimen_diambil' || o.status === 'menunggu_hasil');

/** Isian awal; hasil yang sudah tersimpan (menunggu validasi) diisikan kembali. */
export function awalHasilLab(orders: readonly OrderPenunjangDto[]): KeadaanHasilLab {
  const k: KeadaanHasilLab = { nilai: {}, interpretasi: {}, catatan: {}, validasi: true };
  for (const o of menungguHasil(orders)) {
    k.nilai[o.id] = o.hasil?.nilai ?? '';
    k.interpretasi[o.id] = o.hasil?.interpretasi ?? '';
    k.catatan[o.id] = o.hasil?.catatan ?? '';
  }
  return k;
}

export const ubahIsian = (k: KeadaanHasilLab, bidang: 'nilai' | 'interpretasi' | 'catatan', id: number, v: string): KeadaanHasilLab => ({ ...k, [bidang]: { ...k[bidang], [id]: v } });

/** Interpretasi yang disarankan dari rentang rujukan; kosong bila tidak dapat ditentukan. */
export const saranUntuk = (o: Pick<OrderPenunjangDto, 'rujukan_min' | 'rujukan_maks'>, nilai: string): InterpretasiHasil | null => sarankanInterpretasi(nilai, o.rujukan_min, o.rujukan_maks);

/** Mengisi interpretasi yang masih kosong dengan saran rentang rujukan (pilihan analis yang sudah ada tidak ditimpa). */
export function terapkanSaran(k: KeadaanHasilLab, orders: readonly OrderPenunjangDto[]): KeadaanHasilLab {
  const interpretasi = { ...k.interpretasi };
  for (const o of menungguHasil(orders)) {
    const nilai = (k.nilai[o.id] ?? '').trim();
    if (nilai && !interpretasi[o.id]) interpretasi[o.id] = saranUntuk(o, nilai) ?? '';
  }
  return { ...k, interpretasi };
}

export type RencanaHasil = { order: OrderPenunjangDto; nilai: string; interpretasi: InterpretasiHasil; catatan: string | null };

/** Order yang nilainya terisi dan interpretasinya sah; hanya ini yang diproses saat menyimpan. */
export function rencanaHasil(k: KeadaanHasilLab, orders: readonly OrderPenunjangDto[]): RencanaHasil[] {
  return menungguHasil(orders).flatMap((order) => {
    const nilai = (k.nilai[order.id] ?? '').trim();
    const i = k.interpretasi[order.id] ?? '';
    if (!nilai || !(INTERPRETASI_HASIL.nilai as readonly string[]).includes(i)) return [];
    return [{ order, nilai, interpretasi: i as InterpretasiHasil, catatan: (k.catatan[order.id] ?? '').trim() || null }];
  });
}

/** Galat per order (kunci id): nilai terisi tetapi interpretasi belum dipilih. Order tanpa nilai tidak diproses sehingga bukan galat. */
export function galatHasilLab(k: KeadaanHasilLab, orders: readonly OrderPenunjangDto[]): Record<string, string> {
  const g: Record<string, string> = {};
  for (const o of menungguHasil(orders)) {
    const nilai = (k.nilai[o.id] ?? '').trim();
    const i = k.interpretasi[o.id] ?? '';
    if (nilai.length > 200) g[o.id] = PENUNJANG.galat.nilaiWajib;
    else if (nilai && !(INTERPRETASI_HASIL.nilai as readonly string[]).includes(i)) g[o.id] = PENUNJANG.galat.pilihInterpretasi;
  }
  return g;
}

/** Indeks langkah (0 hasil, 1 interpretasi, 2 validasi) yang butuh perbaikan, atau -1. */
export function langkahBermasalahHasil(k: KeadaanHasilLab, orders: readonly OrderPenunjangDto[]): number {
  if (!menungguHasil(orders).some((o) => (k.nilai[o.id] ?? '').trim())) return 0;
  return Object.keys(galatHasilLab(k, orders)).length ? 1 : -1;
}

/** Draf tersimpan menimpa isian awal hanya untuk order yang masih menunggu hasil (order lain yang sudah berubah dibuang). */
export function pulihkanHasilLab(awal: KeadaanHasilLab, draf: Partial<KeadaanHasilLab> | null | undefined): KeadaanHasilLab {
  if (!draf) return awal;
  const ambil = (bidang: 'nilai' | 'interpretasi' | 'catatan') =>
    Object.fromEntries(Object.keys(awal[bidang]).map((id) => [id, typeof draf[bidang]?.[id] === 'string' ? (draf[bidang] as Record<string, string>)[id] : awal[bidang][id]]));
  return { nilai: ambil('nilai'), interpretasi: ambil('interpretasi'), catatan: ambil('catatan'), validasi: typeof draf.validasi === 'boolean' ? draf.validasi : awal.validasi };
}
