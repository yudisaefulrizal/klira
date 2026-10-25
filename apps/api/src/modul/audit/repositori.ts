import { prisma } from '@klira/db';
import type { Prisma } from '@klira/db';

export type CatatanBaru = {
  fasyankes_id: number | null;
  pengguna_id: number | null;
  aksi: string;
  entitas: string;
  entitas_id: number | null;
  keterangan: string | null;
  alamat: string | null;
  waktu: Date;
};
export type CatatanTersimpan = CatatanBaru & { id: number };
export type SaringanRepo = { fasyankes_id: number; pengguna_id?: number; aksi?: string; entitas?: string; dari?: Date; sampai?: Date };

/** Log hanya-tambah: antarmuka ini sengaja tanpa ubah dan hapus. */
export interface RepositoriAudit {
  tambah(c: CatatanBaru): Promise<void>;
  cari(f: SaringanRepo, lewati: number, ambil: number): Promise<{ total: number; baris: CatatanTersimpan[] }>;
  ambil(id: number, fasyankesId: number): Promise<CatatanTersimpan | null>;
  namaPengguna(ids: number[]): Promise<Map<number, string>>;
}

const where = (f: SaringanRepo): Prisma.LogAuditWhereInput => ({
  fasyankes_id: f.fasyankes_id,
  ...(f.pengguna_id !== undefined ? { pengguna_id: f.pengguna_id } : {}),
  ...(f.aksi ? { aksi: f.aksi } : {}),
  ...(f.entitas ? { entitas: f.entitas } : {}),
  ...(f.dari || f.sampai ? { waktu: { ...(f.dari ? { gte: f.dari } : {}), ...(f.sampai ? { lte: f.sampai } : {}) } } : {}),
});

export class RepositoriAuditPrisma implements RepositoriAudit {
  async tambah(c: CatatanBaru): Promise<void> {
    await prisma.logAudit.create({ data: c });
  }

  async cari(f: SaringanRepo, lewati: number, ambil: number) {
    const [total, baris] = await Promise.all([
      prisma.logAudit.count({ where: where(f) }),
      prisma.logAudit.findMany({ where: where(f), orderBy: [{ waktu: 'desc' }, { id: 'desc' }], skip: lewati, take: ambil }),
    ]);
    return { total, baris };
  }

  ambil(id: number, fasyankesId: number) {
    return prisma.logAudit.findFirst({ where: { id, fasyankes_id: fasyankesId } });
  }

  async namaPengguna(ids: number[]) {
    const unik = [...new Set(ids)];
    if (!unik.length) return new Map<number, string>();
    const p = await prisma.pengguna.findMany({ where: { id: { in: unik } }, select: { id: true, nama: true } });
    return new Map(p.map((x) => [x.id, x.nama]));
  }
}
