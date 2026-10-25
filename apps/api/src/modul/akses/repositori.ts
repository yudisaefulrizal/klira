import { prisma } from '@klira/db';
import type { AksesAkun, AkunMasuk, SesiAktif } from './skema';

export interface RepositoriAkses {
  cariAkunByUsername(username: string): Promise<AkunMasuk | null>;
  ambilAkses(penggunaId: number, sekarang: Date): Promise<AksesAkun>;
  buatSesi(data: { idHash: string; akun: AkunMasuk; alamat?: string; kedaluwarsa: Date }): Promise<void>;
  cariSesi(idHash: string, sekarang: Date): Promise<SesiAktif | null>;
  hapusSesi(idHash: string): Promise<void>;
  hapusKedaluwarsa(sekarang: Date): Promise<void>;
}

const pilihAkun = {
  id: true, fasyankes_id: true, nama: true, username: true,
  kata_sandi_hash: true, aktif: true, wajib_ganti_kredensial: true,
} as const;

export class RepositoriAksesPrisma implements RepositoriAkses {
  async cariAkunByUsername(username: string): Promise<AkunMasuk | null> {
    return prisma.pengguna.findFirst({ where: { username, aktif: true }, orderBy: { id: 'asc' }, select: pilihAkun });
  }

  async ambilAkses(penggunaId: number, sekarang: Date): Promise<AksesAkun> {
    const penugasan = await prisma.penugasanJenis.findMany({
      where: {
        pengguna_id: penggunaId,
        mulai: { lte: sekarang },
        OR: [{ selesai: null }, { selesai: { gt: sekarang } }],
        jenis_akun: { aktif: true },
      },
      include: { jenis_akun: { include: { izin: { include: { izin: true } } } } },
    });
    const jenis = new Set<string>();
    const fitur = new Set<string>();
    for (const p of penugasan) {
      jenis.add(p.jenis_akun.nama);
      for (const ij of p.jenis_akun.izin) fitur.add(ij.izin.fitur);
    }
    return { jenis_akun: [...jenis], fitur: [...fitur] };
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
}
