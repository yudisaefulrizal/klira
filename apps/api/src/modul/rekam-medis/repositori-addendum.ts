import { prisma, Prisma } from '@klira/db';
import type { JenisAkunPengesah } from './pengesahan';
import { hashIsi } from './pengesahan';
import { tulisPengesahanDalam } from './repositori';

export type TulisAddendum = {
  fasyankesId: number;
  kunjunganId: number;
  entitas: string;
  entitasId: number;
  isi: Record<string, unknown>;
  alasan: string;
  oleh: number;
  jenisAkun: JenisAkunPengesah | null;
  waktu: Date;
};

/**
 * Tulis satu addendum di dalam transaksi pemanggil (hasil lab susulan; CPPT dan resume nanti memakai jalur yang sama). Hanya INSERT:
 * baris addendum (versi per entitas), versi catatan kunjungan (penanda kronologis, `isi_lama` hanya menunjuk addendum karena tidak ada isi yang
 * digantikan), dan pengesahan baru atas isi addendum (entitas `addendum`). Balapan versi muncul sebagai P2002 dari pemanggil.
 */
export async function tulisAddendumDalam(tx: Prisma.TransactionClient, d: TulisAddendum): Promise<{ id: number; versi: number }> {
  const terakhir = await tx.addendum.aggregate({ where: { entitas: d.entitas, entitas_id: d.entitasId }, _max: { versi: true } });
  const versi = (terakhir._max.versi ?? 0) + 1;
  const a = await tx.addendum.create({
    data: {
      fasyankes_id: d.fasyankesId, kunjungan_id: d.kunjunganId, entitas: d.entitas, entitas_id: d.entitasId, versi, isi: d.isi as Prisma.InputJsonValue, alasan: d.alasan,
      waktu: d.waktu, dibuat_oleh: d.oleh,
    },
  });
  const versiKunjungan = await tx.versiCatatan.aggregate({ where: { entitas: 'kunjungan', entitas_id: d.kunjunganId }, _max: { versi: true } });
  await tx.versiCatatan.create({
    data: {
      fasyankes_id: d.fasyankesId, entitas: 'kunjungan', entitas_id: d.kunjunganId, versi: (versiKunjungan._max.versi ?? 0) + 1,
      isi_lama: { jenis: 'addendum', addendum_id: a.id, entitas: d.entitas, entitas_id: d.entitasId }, alasan: d.alasan, disetujui_oleh: null, dibuat_oleh: d.oleh,
    },
  });
  await tulisPengesahanDalam(tx, {
    fasyankesId: d.fasyankesId, entitas: 'addendum', entitasId: a.id, versi: 1, penggunaId: d.oleh, jenisAkun: d.jenisAkun, hash: hashIsi(d.isi), waktu: d.waktu, versiLama: null,
  });
  return { id: a.id, versi };
}

export type BarisAddendum = {
  id: number; kunjungan_id: number; entitas: string; entitas_id: number; versi: number; isi: Record<string, unknown>; alasan: string; waktu: Date;
  dibuat_oleh_nama: string | null; perlu_kirim_ulang: boolean; dikirim_pada: Date | null;
};

export interface RepositoriAddendum {
  kunjunganAda(fasyankesId: number, kunjunganId: number): Promise<boolean>;
  daftar(fasyankesId: number, kunjunganId: number): Promise<BarisAddendum[]>;
  untukEntitas(fasyankesId: number, entitas: string, entitasIds: readonly number[]): Promise<BarisAddendum[]>;
  isi(fasyankesId: number, id: number): Promise<unknown>;
}

export class RepositoriAddendumPrisma implements RepositoriAddendum {
  private async petakan(fasyankesId: number, baris: { id: number; kunjungan_id: number; entitas: string; entitas_id: number; versi: number; isi: Prisma.JsonValue; alasan: string; waktu: Date; dibuat_oleh: number | null; perlu_kirim_ulang: boolean; dikirim_pada: Date | null }[]): Promise<BarisAddendum[]> {
    const ids = [...new Set(baris.flatMap((b) => (b.dibuat_oleh ? [b.dibuat_oleh] : [])))];
    const pengguna = ids.length ? await prisma.pengguna.findMany({ where: { id: { in: ids }, fasyankes_id: fasyankesId }, select: { id: true, nama: true } }) : [];
    const nama = new Map(pengguna.map((p) => [p.id, p.nama]));
    return baris.map((b) => ({
      id: b.id, kunjungan_id: b.kunjungan_id, entitas: b.entitas, entitas_id: b.entitas_id, versi: b.versi, isi: (b.isi ?? {}) as Record<string, unknown>, alasan: b.alasan, waktu: b.waktu,
      dibuat_oleh_nama: b.dibuat_oleh ? nama.get(b.dibuat_oleh) ?? null : null, perlu_kirim_ulang: b.perlu_kirim_ulang, dikirim_pada: b.dikirim_pada,
    }));
  }

  async kunjunganAda(fasyankesId: number, kunjunganId: number): Promise<boolean> {
    return (await prisma.kunjungan.count({ where: { id: kunjunganId, fasyankes_id: fasyankesId } })) > 0;
  }

  async daftar(fasyankesId: number, kunjunganId: number): Promise<BarisAddendum[]> {
    return this.petakan(fasyankesId, await prisma.addendum.findMany({ where: { fasyankes_id: fasyankesId, kunjungan_id: kunjunganId }, orderBy: { id: 'asc' }, take: 200 }));
  }

  async untukEntitas(fasyankesId: number, entitas: string, entitasIds: readonly number[]): Promise<BarisAddendum[]> {
    if (!entitasIds.length) return [];
    return this.petakan(fasyankesId, await prisma.addendum.findMany({ where: { fasyankes_id: fasyankesId, entitas, entitas_id: { in: [...entitasIds] } }, orderBy: { id: 'asc' } }));
  }

  async isi(fasyankesId: number, id: number): Promise<unknown> {
    return (await prisma.addendum.findFirst({ where: { id, fasyankes_id: fasyankesId }, select: { isi: true } }))?.isi ?? null;
  }
}
