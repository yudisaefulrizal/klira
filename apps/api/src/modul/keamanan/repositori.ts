import { prisma } from '@klira/db';
import type { PengaturanKeamananMasukan } from '@klira/shared';

export type BarisPengaturan = PengaturanKeamananMasukan & { diubah_pada: Date };
export type BarisBackup = { id: number; waktu: Date; status: string; ukuran_byte: number | null; lokasi: string | null };

export interface RepositoriKeamanan {
  ambilPengaturan(fasyankesId: number): Promise<BarisPengaturan | null>;
  simpanPengaturan(fasyankesId: number, nilai: PengaturanKeamananMasukan, oleh: number): Promise<BarisPengaturan>;
  /** Hanya baca: baris riwayat diisi tugas backup di worker. */
  daftarBackup(fasyankesId: number, lewati: number, ambil: number): Promise<{ total: number; baris: BarisBackup[] }>;
}

const kolom = { masa_sesi_jam: true, batas_percobaan_masuk: true, panjang_minimum_kata_sandi: true, diubah_pada: true } as const;

export class RepositoriKeamananPrisma implements RepositoriKeamanan {
  ambilPengaturan(fasyankesId: number): Promise<BarisPengaturan | null> {
    return prisma.pengaturanKeamanan.findUnique({ where: { fasyankes_id: fasyankesId }, select: kolom });
  }

  simpanPengaturan(fasyankesId: number, nilai: PengaturanKeamananMasukan, oleh: number): Promise<BarisPengaturan> {
    const sekarang = new Date();
    return prisma.pengaturanKeamanan.upsert({
      where: { fasyankes_id: fasyankesId },
      create: { fasyankes_id: fasyankesId, ...nilai, diubah_oleh: oleh, dibuat_oleh: oleh, diubah_pada: sekarang },
      update: { ...nilai, diubah_oleh: oleh, diubah_pada: sekarang },
      select: kolom,
    });
  }

  async daftarBackup(fasyankesId: number, lewati: number, ambil: number) {
    const [total, baris] = await Promise.all([
      prisma.riwayatBackup.count({ where: { fasyankes_id: fasyankesId } }),
      prisma.riwayatBackup.findMany({
        where: { fasyankes_id: fasyankesId }, orderBy: [{ waktu: 'desc' }, { id: 'desc' }], skip: lewati, take: ambil,
        select: { id: true, waktu: true, status: true, ukuran_byte: true, lokasi: true },
      }),
    ]);
    return { total, baris: baris.map((b) => ({ ...b, ukuran_byte: b.ukuran_byte === null ? null : Number(b.ukuran_byte) })) };
  }
}
