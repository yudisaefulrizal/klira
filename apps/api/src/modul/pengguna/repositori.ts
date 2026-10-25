import { prisma } from '@klira/db';
import type { Prisma } from '@klira/db';
import type { FilterPengguna, PenggunaDaftarDto } from '@klira/shared';

export type HasilDaftar = { total: number; baris: PenggunaDaftarDto[] };

export interface RepositoriPengguna {
  daftar(fasyankesId: number, f: FilterPengguna, sekarang: Date): Promise<HasilDaftar>;
  /** Ubah status aktif; null bila pengguna bukan milik fasyankes ini. */
  ubahAktif(fasyankesId: number, id: number, aktif: boolean): Promise<{ id: number; nama: string; aktif: boolean; aktifSebelumnya: boolean } | null>;
}

const periodeAktif = (sekarang: Date) => ({
  mulai: { lte: sekarang },
  OR: [{ selesai: null }, { selesai: { gt: sekarang } }],
});

export class RepositoriPenggunaPrisma implements RepositoriPengguna {
  async daftar(fasyankesId: number, f: FilterPengguna, sekarang: Date): Promise<HasilDaftar> {
    const dan: Prisma.PenggunaWhereInput[] = [];
    if (f.cari) dan.push({ OR: [{ nama: { contains: f.cari } }, { username: { contains: f.cari } }] });
    if (f.status !== 'semua') dan.push({ aktif: f.status === 'aktif' });
    if (f.jenis_akun_id) {
      dan.push({ penugasan_jenis: { some: { jenis_akun_id: f.jenis_akun_id, jenis_akun: { aktif: true }, ...periodeAktif(sekarang) } } });
    }
    const where: Prisma.PenggunaWhereInput = { fasyankes_id: fasyankesId, AND: dan };
    const [total, data] = await Promise.all([
      prisma.pengguna.count({ where }),
      prisma.pengguna.findMany({
        where,
        orderBy: [{ nama: 'asc' }, { id: 'asc' }],
        skip: (f.halaman - 1) * f.ukuran,
        take: f.ukuran,
        select: {
          id: true, nama: true, username: true, aktif: true,
          penugasan_jenis: { where: { jenis_akun: { aktif: true }, ...periodeAktif(sekarang) }, select: { jenis_akun: { select: { nama: true } } } },
          izin_per_akun: { where: { tipe: 'tambah', ...periodeAktif(sekarang) }, select: { id: true } },
          peringatan_izin: { where: { diterima_untuk_akun: false, sumber: { not: 'terima' } }, select: { id: true } },
        },
      }),
    ]);
    return {
      total,
      baris: data.map((p) => ({
        id: p.id, nama: p.nama, username: p.username, aktif: p.aktif,
        jenis_akun_aktif: [...new Set(p.penugasan_jenis.map((x) => x.jenis_akun.nama))],
        jumlah_izin_tambahan: p.izin_per_akun.length,
        jumlah_peringatan_terbuka: p.peringatan_izin.length,
      })),
    };
  }

  async ubahAktif(fasyankesId: number, id: number, aktif: boolean) {
    const p = await prisma.pengguna.findFirst({ where: { id, fasyankes_id: fasyankesId }, select: { id: true, nama: true, aktif: true } });
    if (!p) return null;
    if (p.aktif !== aktif) await prisma.pengguna.update({ where: { id }, data: { aktif } });
    return { id: p.id, nama: p.nama, aktif, aktifSebelumnya: p.aktif };
  }
}
