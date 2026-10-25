import { Prisma, prisma } from '@klira/db';
import { hitungAksesEfektif } from './mesin-izin';
import { RepositoriIzinPrisma } from './repositori-izin';
import type { AksesAkun, AkunMasuk, SesiAktif } from './skema';

export interface RepositoriAkses {
  cariAkunByUsername(username: string): Promise<AkunMasuk | null>;
  ambilAkses(penggunaId: number, sekarang: Date): Promise<AksesAkun>;
  buatSesi(data: { idHash: string; akun: AkunMasuk; alamat?: string; kedaluwarsa: Date }): Promise<void>;
  cariSesi(idHash: string, sekarang: Date): Promise<SesiAktif | null>;
  hapusSesi(idHash: string): Promise<void>;
  hapusKedaluwarsa(sekarang: Date): Promise<void>;
  /** Apakah username dipakai akun lain (tanpa membedakan huruf besar/kecil). */
  usernameDipakai(username: string, kecualiPenggunaId: number): Promise<boolean>;
  /**
   * Atomik: ubah username dan hash, matikan wajib ganti, cabut semua sesi akun,
   * lalu buat sesi baru. Melempar KonflikUsername bila username bentrok.
   */
  gantiKredensial(data: {
    akun: AkunMasuk;
    username: string;
    kataSandiHash: string;
    sesiBaru: { idHash: string; alamat?: string; kedaluwarsa: Date };
  }): Promise<void>;
}

export class KonflikUsername extends Error {}

const pilihAkun = {
  id: true, fasyankes_id: true, nama: true, username: true,
  kata_sandi_hash: true, aktif: true, wajib_ganti_kredensial: true,
} as const;

export class RepositoriAksesPrisma implements RepositoriAkses {
  async cariAkunByUsername(username: string): Promise<AkunMasuk | null> {
    return prisma.pengguna.findFirst({ where: { username, aktif: true }, orderBy: { id: 'asc' }, select: pilihAkun });
  }

  /** Akses efektif (2.0): gabungan jenis akun aktif + tambahan - pengurangan pada waktu `sekarang`. */
  async ambilAkses(penggunaId: number, sekarang: Date): Promise<AksesAkun> {
    const snap = await new RepositoriIzinPrisma().ambilSnapshot(penggunaId);
    if (!snap) return { jenis_akun: [], fitur: [], izin: [] };
    const { jenis_akun, fitur, izin } = hitungAksesEfektif(snap, sekarang);
    return { jenis_akun, fitur, izin };
  }

  async buatSesi(data: { idHash: string; akun: AkunMasuk; alamat?: string; kedaluwarsa: Date }): Promise<void> {
    await prisma.sesi.create({
      data: {
        id_hash: data.idHash,
        pengguna_id: data.akun.id,
        fasyankes_id: data.akun.fasyankes_id,
        alamat: data.alamat?.slice(0, 64),
        kedaluwarsa_pada: data.kedaluwarsa,
      },
    });
  }

  async cariSesi(idHash: string, sekarang: Date): Promise<SesiAktif | null> {
    const sesi = await prisma.sesi.findFirst({
      where: { id_hash: idHash, kedaluwarsa_pada: { gt: sekarang }, pengguna: { aktif: true } },
      include: { pengguna: { select: pilihAkun } },
    });
    return sesi ? { akun: sesi.pengguna } : null;
  }

  async hapusSesi(idHash: string): Promise<void> {
    await prisma.sesi.deleteMany({ where: { id_hash: idHash } });
  }

  async hapusKedaluwarsa(sekarang: Date): Promise<void> {
    await prisma.sesi.deleteMany({ where: { kedaluwarsa_pada: { lte: sekarang } } });
  }

  async usernameDipakai(username: string, kecualiPenggunaId: number): Promise<boolean> {
    const ada = await prisma.pengguna.findFirst({
      where: { username, id: { not: kecualiPenggunaId } },
      select: { id: true },
    });
    return ada !== null;
  }

  async gantiKredensial(data: {
    akun: AkunMasuk;
    username: string;
    kataSandiHash: string;
    sesiBaru: { idHash: string; alamat?: string; kedaluwarsa: Date };
  }): Promise<void> {
    try {
      await prisma.$transaction([
        prisma.pengguna.update({
          where: { id: data.akun.id },
          data: { username: data.username, kata_sandi_hash: data.kataSandiHash, wajib_ganti_kredensial: false },
        }),
        prisma.sesi.deleteMany({ where: { pengguna_id: data.akun.id } }),
        prisma.sesi.create({
          data: {
            id_hash: data.sesiBaru.idHash,
            pengguna_id: data.akun.id,
            fasyankes_id: data.akun.fasyankes_id,
            alamat: data.sesiBaru.alamat?.slice(0, 64),
            kedaluwarsa_pada: data.sesiBaru.kedaluwarsa,
          },
        }),
      ]);
    } catch (galat) {
      if (galat instanceof Prisma.PrismaClientKnownRequestError && galat.code === 'P2002') throw new KonflikUsername();
      throw galat;
    }
  }
}
