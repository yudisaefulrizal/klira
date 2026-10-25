import { Prisma, prisma } from '@klira/db';
import type { AksiIzin, CakupanIzin } from '@klira/shared';
import type { SnapshotAkses } from './mesin-izin';

export type BarisIzin = { id: number; fitur: string; aksi: AksiIzin; cakupan: CakupanIzin };
export type BarisJenisAkun = {
  id: number;
  fasyankes_id: number;
  nama: string;
  syarat_profesi: string | null;
  aktif: boolean;
  diubah_oleh: number | null;
  alasan_perubahan: string | null;
  dibuat_pada: Date;
  izin: BarisIzin[];
};
export type BarisRiwayat = { id: number; jenis_akun_id: number; ringkasan: string; alasan: string | null; dibuat_oleh: number | null; dibuat_pada: Date };
export type BarisPenugasan = {
  id: number; fasyankes_id: number; pengguna_id: number; jenis_akun_id: number;
  mulai: Date; selesai: Date | null; ditetapkan_oleh: number | null;
};
export type BarisIzinAkun = {
  id: number; fasyankes_id: number; pengguna_id: number; izin_id: number; tipe: 'tambah' | 'kurang';
  alasan: string; mulai: Date; selesai: Date | null; ditetapkan_oleh: number | null;
};
export type BarisPeringatan = {
  id: number; fasyankes_id: number; pengguna_id: number; izin_id: number | null; penugasan_id: number | null;
  jenis_peringatan: string; alasan_pimpinan: string; sumber: string; diterima_untuk_akun: boolean;
  keterangan: string | null; ditetapkan_oleh: number | null; waktu: Date;
};
export type EntriPeringatan = Omit<BarisPeringatan, 'id' | 'waktu'>;
export type FilterPeringatan = { pengguna_id?: number; jenis_peringatan?: string; halaman: number; ukuran: number };

export class KonflikNama extends Error {}

export interface RepositoriIzin {
  /** Pengguna dalam fasyankes ini? */
  penggunaAda(penggunaId: number, fasyankesId: number): Promise<boolean>;
  ambilSnapshot(penggunaId: number): Promise<SnapshotAkses | null>;
  daftarIzin(): Promise<BarisIzin[]>;
  izinByIds(ids: number[]): Promise<BarisIzin[]>;
  cariIzin(fitur: string, aksi: string, cakupan: string): Promise<BarisIzin | null>;

  daftarJenisAkun(fasyankesId: number): Promise<BarisJenisAkun[]>;
  ambilJenisAkun(fasyankesId: number, id: number): Promise<BarisJenisAkun | null>;
  buatJenisAkun(data: { fasyankes_id: number; nama: string; syarat_profesi: string | null; izin_ids: number[]; alasan: string | null; oleh: number; ringkasan: string }): Promise<BarisJenisAkun>;
  ubahJenisAkun(data: {
    fasyankes_id: number; id: number; nama?: string; syarat_profesi?: string | null; izin_ids?: number[]; aktif?: boolean;
    alasan: string; oleh: number; ringkasan: string;
  }): Promise<BarisJenisAkun>;
  riwayatJenisAkun(fasyankesId: number, id: number): Promise<BarisRiwayat[]>;

  daftarPenugasan(penggunaId: number): Promise<BarisPenugasan[]>;
  ambilPenugasan(penggunaId: number, id: number): Promise<BarisPenugasan | null>;
  buatPenugasan(data: Omit<BarisPenugasan, 'id'>): Promise<BarisPenugasan>;
  akhiriPenugasan(id: number, selesai: Date): Promise<BarisPenugasan>;

  daftarIzinAkun(penggunaId: number): Promise<BarisIzinAkun[]>;
  ambilIzinAkun(penggunaId: number, id: number): Promise<BarisIzinAkun | null>;
  buatIzinAkun(data: Omit<BarisIzinAkun, 'id'>): Promise<BarisIzinAkun>;
  akhiriIzinAkun(id: number, selesai: Date): Promise<BarisIzinAkun>;

  simpanPeringatan(entri: EntriPeringatan[]): Promise<BarisPeringatan[]>;
  daftarPeringatan(fasyankesId: number, f: FilterPeringatan): Promise<{ data: BarisPeringatan[]; total: number }>;
  /** Catatan penerimaan terakhir untuk akun dan jenis peringatan (null bila belum diterima). */
  cariDiterima(penggunaId: number, jenis: string): Promise<BarisPeringatan | null>;
  alasanTerakhir(penggunaId: number, jenis: string): Promise<string | null>;
  adaTindakanSejak(penggunaId: number, kunci: string, sejak: Date): Promise<boolean>;
}

const pilihIzin = { id: true, fitur: true, aksi: true, cakupan: true } as const;

type JenisDb = Prisma.JenisAkunGetPayload<{ include: { izin: { include: { izin: true } } } }>;
const petaJenis = (j: JenisDb): BarisJenisAkun => ({
  id: j.id, fasyankes_id: j.fasyankes_id, nama: j.nama, syarat_profesi: j.syarat_profesi, aktif: j.aktif,
  diubah_oleh: j.diubah_oleh, alasan_perubahan: j.alasan_perubahan, dibuat_pada: j.dibuat_pada,
  izin: j.izin.map((x) => ({ id: x.izin.id, fitur: x.izin.fitur, aksi: x.izin.aksi, cakupan: x.izin.cakupan })),
});
const sertakanIzin = { izin: { include: { izin: true } } } as const;

export class RepositoriIzinPrisma implements RepositoriIzin {
  async penggunaAda(penggunaId: number, fasyankesId: number): Promise<boolean> {
    return (await prisma.pengguna.count({ where: { id: penggunaId, fasyankes_id: fasyankesId } })) > 0;
  }

  async ambilSnapshot(penggunaId: number): Promise<SnapshotAkses | null> {
    const p = await prisma.pengguna.findUnique({
      where: { id: penggunaId },
      select: {
        id: true, aktif: true,
        profil_profesi: { select: { profesi: true, nomor_sip: true, masa_berlaku_sip: true } },
        penugasan_jenis: { include: { jenis_akun: { include: sertakanIzin } } },
        izin_per_akun: { include: { izin: true } },
      },
    });
    if (!p) return null;
    return {
      pengguna_id: p.id,
      aktif: p.aktif,
      profil: p.profil_profesi,
      penugasan: p.penugasan_jenis.map((x) => ({
        id: x.id, jenis_akun_id: x.jenis_akun_id, jenis_nama: x.jenis_akun.nama, syarat_profesi: x.jenis_akun.syarat_profesi,
        jenis_aktif: x.jenis_akun.aktif, mulai: x.mulai, selesai: x.selesai,
        izin: x.jenis_akun.izin.map((i) => ({ fitur: i.izin.fitur, aksi: i.izin.aksi, cakupan: i.izin.cakupan })),
      })),
      izin_akun: p.izin_per_akun.map((x) => ({
        id: x.id, tipe: x.tipe, mulai: x.mulai, selesai: x.selesai,
        izin: { fitur: x.izin.fitur, aksi: x.izin.aksi, cakupan: x.izin.cakupan },
      })),
    };
  }

  daftarIzin(): Promise<BarisIzin[]> {
    return prisma.izin.findMany({ select: pilihIzin, orderBy: { id: 'asc' } });
  }
  izinByIds(ids: number[]): Promise<BarisIzin[]> {
    return prisma.izin.findMany({ where: { id: { in: ids } }, select: pilihIzin });
  }
  cariIzin(fitur: string, aksi: string, cakupan: string): Promise<BarisIzin | null> {
    return prisma.izin.findFirst({ where: { fitur, aksi: aksi as AksiIzin, cakupan: cakupan as CakupanIzin }, select: pilihIzin });
  }

  async daftarJenisAkun(fasyankesId: number): Promise<BarisJenisAkun[]> {
    const j = await prisma.jenisAkun.findMany({ where: { fasyankes_id: fasyankesId }, include: sertakanIzin, orderBy: { id: 'asc' } });
    return j.map(petaJenis);
  }
  async ambilJenisAkun(fasyankesId: number, id: number): Promise<BarisJenisAkun | null> {
    const j = await prisma.jenisAkun.findFirst({ where: { id, fasyankes_id: fasyankesId }, include: sertakanIzin });
    return j ? petaJenis(j) : null;
  }

  async buatJenisAkun(d: Parameters<RepositoriIzin['buatJenisAkun']>[0]): Promise<BarisJenisAkun> {
    try {
      const id = await prisma.$transaction(async (tx) => {
        const j = await tx.jenisAkun.create({
          data: {
            fasyankes_id: d.fasyankes_id, nama: d.nama, syarat_profesi: d.syarat_profesi, dibuat_oleh: d.oleh,
            diubah_oleh: d.oleh, alasan_perubahan: d.alasan,
          },
        });
        await tx.izinJenisAkun.createMany({
          data: d.izin_ids.map((izin_id) => ({ fasyankes_id: d.fasyankes_id, jenis_akun_id: j.id, izin_id, dibuat_oleh: d.oleh })),
        });
        await tx.riwayatJenisAkun.create({
          data: { fasyankes_id: d.fasyankes_id, jenis_akun_id: j.id, ringkasan: d.ringkasan, alasan: d.alasan, dibuat_oleh: d.oleh },
        });
        return j.id;
      });
      return (await this.ambilJenisAkun(d.fasyankes_id, id)) as BarisJenisAkun;
    } catch (galat) {
      if (galat instanceof Prisma.PrismaClientKnownRequestError && galat.code === 'P2002') throw new KonflikNama();
      throw galat;
    }
  }

  async ubahJenisAkun(d: Parameters<RepositoriIzin['ubahJenisAkun']>[0]): Promise<BarisJenisAkun> {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.jenisAkun.update({
          where: { id: d.id },
          data: {
            ...(d.nama !== undefined ? { nama: d.nama } : {}),
            ...(d.syarat_profesi !== undefined ? { syarat_profesi: d.syarat_profesi } : {}),
            ...(d.aktif !== undefined ? { aktif: d.aktif } : {}),
            diubah_oleh: d.oleh, alasan_perubahan: d.alasan,
          },
        });
        if (d.izin_ids) {
          // Isi paket diganti; jejak perubahan tersimpan di riwayat_jenis_akun.
          await tx.izinJenisAkun.deleteMany({ where: { jenis_akun_id: d.id, izin_id: { notIn: d.izin_ids } } });
          await tx.izinJenisAkun.createMany({
            data: d.izin_ids.map((izin_id) => ({ fasyankes_id: d.fasyankes_id, jenis_akun_id: d.id, izin_id, dibuat_oleh: d.oleh })),
            skipDuplicates: true,
          });
        }
        await tx.riwayatJenisAkun.create({
          data: { fasyankes_id: d.fasyankes_id, jenis_akun_id: d.id, ringkasan: d.ringkasan, alasan: d.alasan, dibuat_oleh: d.oleh },
        });
      });
    } catch (galat) {
      if (galat instanceof Prisma.PrismaClientKnownRequestError && galat.code === 'P2002') throw new KonflikNama();
      throw galat;
    }
    return (await this.ambilJenisAkun(d.fasyankes_id, d.id)) as BarisJenisAkun;
  }

  riwayatJenisAkun(fasyankesId: number, id: number): Promise<BarisRiwayat[]> {
    return prisma.riwayatJenisAkun.findMany({
      where: { fasyankes_id: fasyankesId, jenis_akun_id: id },
      select: { id: true, jenis_akun_id: true, ringkasan: true, alasan: true, dibuat_oleh: true, dibuat_pada: true },
      orderBy: { id: 'desc' },
    });
  }

  daftarPenugasan(penggunaId: number): Promise<BarisPenugasan[]> {
    return prisma.penugasanJenis.findMany({ where: { pengguna_id: penggunaId }, orderBy: { id: 'asc' }, select: kolomPenugasan });
  }
  ambilPenugasan(penggunaId: number, id: number): Promise<BarisPenugasan | null> {
    return prisma.penugasanJenis.findFirst({ where: { id, pengguna_id: penggunaId }, select: kolomPenugasan });
  }
  buatPenugasan(d: Omit<BarisPenugasan, 'id'>): Promise<BarisPenugasan> {
    return prisma.penugasanJenis.create({ data: { ...d, dibuat_oleh: d.ditetapkan_oleh }, select: kolomPenugasan });
  }
  akhiriPenugasan(id: number, selesai: Date): Promise<BarisPenugasan> {
    return prisma.penugasanJenis.update({ where: { id }, data: { selesai }, select: kolomPenugasan });
  }

  daftarIzinAkun(penggunaId: number): Promise<BarisIzinAkun[]> {
    return prisma.izinPerAkun.findMany({ where: { pengguna_id: penggunaId }, orderBy: { id: 'asc' }, select: kolomIzinAkun });
  }
  ambilIzinAkun(penggunaId: number, id: number): Promise<BarisIzinAkun | null> {
    return prisma.izinPerAkun.findFirst({ where: { id, pengguna_id: penggunaId }, select: kolomIzinAkun });
  }
  buatIzinAkun(d: Omit<BarisIzinAkun, 'id'>): Promise<BarisIzinAkun> {
    return prisma.izinPerAkun.create({ data: { ...d, dibuat_oleh: d.ditetapkan_oleh }, select: kolomIzinAkun });
  }
  akhiriIzinAkun(id: number, selesai: Date): Promise<BarisIzinAkun> {
    return prisma.izinPerAkun.update({ where: { id }, data: { selesai }, select: kolomIzinAkun });
  }

  async simpanPeringatan(entri: EntriPeringatan[]): Promise<BarisPeringatan[]> {
    const hasil: BarisPeringatan[] = [];
    for (const e of entri) {
      hasil.push(await prisma.peringatanIzin.create({ data: { ...e, dibuat_oleh: e.ditetapkan_oleh }, select: kolomPeringatan }));
    }
    return hasil;
  }

  async daftarPeringatan(fasyankesId: number, f: FilterPeringatan): Promise<{ data: BarisPeringatan[]; total: number }> {
    const where = {
      fasyankes_id: fasyankesId,
      ...(f.pengguna_id ? { pengguna_id: f.pengguna_id } : {}),
      ...(f.jenis_peringatan ? { jenis_peringatan: f.jenis_peringatan } : {}),
    };
    const [data, total] = await Promise.all([
      prisma.peringatanIzin.findMany({ where, select: kolomPeringatan, orderBy: { id: 'desc' }, skip: (f.halaman - 1) * f.ukuran, take: f.ukuran }),
      prisma.peringatanIzin.count({ where }),
    ]);
    return { data, total };
  }

  cariDiterima(penggunaId: number, jenis: string): Promise<BarisPeringatan | null> {
    return prisma.peringatanIzin.findFirst({
      where: { pengguna_id: penggunaId, jenis_peringatan: jenis, diterima_untuk_akun: true },
      orderBy: { id: 'asc' },
      select: kolomPeringatan,
    });
  }
  async alasanTerakhir(penggunaId: number, jenis: string): Promise<string | null> {
    const r = await prisma.peringatanIzin.findFirst({
      where: { pengguna_id: penggunaId, jenis_peringatan: jenis, sumber: { not: 'tindakan' } },
      orderBy: { id: 'desc' },
      select: { alasan_pimpinan: true },
    });
    return r?.alasan_pimpinan ?? null;
  }
  async adaTindakanSejak(penggunaId: number, kunci: string, sejak: Date): Promise<boolean> {
    return (
      (await prisma.peringatanIzin.count({
        where: { pengguna_id: penggunaId, sumber: 'tindakan', keterangan: kunci, waktu: { gte: sejak } },
      })) > 0
    );
  }
}

const kolomPenugasan = { id: true, fasyankes_id: true, pengguna_id: true, jenis_akun_id: true, mulai: true, selesai: true, ditetapkan_oleh: true } as const;
const kolomIzinAkun = {
  id: true, fasyankes_id: true, pengguna_id: true, izin_id: true, tipe: true, alasan: true, mulai: true, selesai: true, ditetapkan_oleh: true,
} as const;
const kolomPeringatan = {
  id: true, fasyankes_id: true, pengguna_id: true, izin_id: true, penugasan_id: true, jenis_peringatan: true, alasan_pimpinan: true,
  sumber: true, diterima_untuk_akun: true, keterangan: true, ditetapkan_oleh: true, waktu: true,
} as const;
