import { prisma } from '@klira/db';
import type { Prisma } from '@klira/db';
import type { AksiIzin, VersiCatatanDto } from '@klira/shared';
import type { JenisAkunPengesah } from './pengesahan';

export type PengesahanTersimpan = {
  versi: number;
  pengguna_id: number;
  pengguna_nama: string;
  jenis_akun_id: number | null;
  jenis_akun_nama: string | null;
  waktu: Date;
  hash: string;
};

export type VersiLama = { versi: number; isi_lama: unknown; alasan: string; disetujui_oleh: number | null };

/** Data tulis satu pengesahan (dan versi catatan bila ini perbaikan); ditulis dalam transaksi pemanggil. */
export type TulisPengesahan = {
  fasyankesId: number;
  entitas: string;
  entitasId: number;
  versi: number;
  penggunaId: number;
  jenisAkun: JenisAkunPengesah | null;
  hash: string;
  waktu: Date;
  versiLama: VersiLama | null;
};

export interface RepositoriPengesahan {
  terakhir(fasyankesId: number, entitas: string, entitasId: number): Promise<PengesahanTersimpan | null>;
  /** Jenis akun aktif milik pengguna (penugasan berjalan) yang paketnya memuat fitur x aksi. */
  jenisAkunPemberiHak(fasyankesId: number, penggunaId: number, fitur: string, aksi: AksiIzin, sekarang: Date): Promise<JenisAkunPengesah[]>;
  riwayatVersi(fasyankesId: number, entitas: string, entitasId: number): Promise<VersiCatatanDto[]>;
}

/**
 * Tulis pengesahan di dalam transaksi pemanggil (repositori modul klinis, CPPT, resume, hasil lab nanti memakainya agar isi dan
 * pengesahannya tersimpan atomik). Hanya INSERT: versi catatan dan pengesahan tidak pernah diubah atau dihapus.
 */
export async function tulisPengesahanDalam(tx: Prisma.TransactionClient, d: TulisPengesahan): Promise<void> {
  if (d.versiLama) {
    await tx.versiCatatan.create({
      data: {
        fasyankes_id: d.fasyankesId, entitas: d.entitas, entitas_id: d.entitasId, versi: d.versiLama.versi, isi_lama: d.versiLama.isi_lama as Prisma.InputJsonValue,
        alasan: d.versiLama.alasan, disetujui_oleh: d.versiLama.disetujui_oleh, dibuat_oleh: d.penggunaId,
      },
    });
  }
  await tx.pengesahanCatatan.create({
    data: {
      fasyankes_id: d.fasyankesId, entitas: d.entitas, entitas_id: d.entitasId, versi: d.versi, pengguna_id: d.penggunaId, jenis_akun_id: d.jenisAkun?.id ?? null,
      jenis_akun_nama: d.jenisAkun?.nama ?? null, waktu: d.waktu, hash: d.hash, dibuat_oleh: d.penggunaId,
    },
  });
}

export class RepositoriPengesahanPrisma implements RepositoriPengesahan {
  async terakhir(fasyankesId: number, entitas: string, entitasId: number): Promise<PengesahanTersimpan | null> {
    const p = await prisma.pengesahanCatatan.findFirst({ where: { fasyankes_id: fasyankesId, entitas, entitas_id: entitasId }, orderBy: { versi: 'desc' } });
    if (!p) return null;
    const pengguna = await prisma.pengguna.findUnique({ where: { id: p.pengguna_id }, select: { nama: true } });
    return {
      versi: p.versi, pengguna_id: p.pengguna_id, pengguna_nama: pengguna?.nama ?? '-', jenis_akun_id: p.jenis_akun_id, jenis_akun_nama: p.jenis_akun_nama, waktu: p.waktu, hash: p.hash,
    };
  }

  async jenisAkunPemberiHak(fasyankesId: number, penggunaId: number, fitur: string, aksi: AksiIzin, sekarang: Date): Promise<JenisAkunPengesah[]> {
    const baris = await prisma.penugasanJenis.findMany({
      where: {
        fasyankes_id: fasyankesId, pengguna_id: penggunaId, mulai: { lte: sekarang }, OR: [{ selesai: null }, { selesai: { gt: sekarang } }],
        jenis_akun: { aktif: true, izin: { some: { izin: { fitur, aksi } } } },
      },
      select: { jenis_akun: { select: { id: true, nama: true } } },
      orderBy: { jenis_akun_id: 'asc' },
    });
    return baris.map((b) => b.jenis_akun);
  }

  async riwayatVersi(fasyankesId: number, entitas: string, entitasId: number): Promise<VersiCatatanDto[]> {
    const baris = await prisma.versiCatatan.findMany({ where: { fasyankes_id: fasyankesId, entitas, entitas_id: entitasId }, orderBy: { versi: 'desc' }, take: 100 });
    return baris.map((v) => ({ versi: v.versi, alasan: v.alasan, disetujui_oleh: v.disetujui_oleh, dibuat_oleh: v.dibuat_oleh, dibuat_pada: v.dibuat_pada.toISOString() }));
  }
}
