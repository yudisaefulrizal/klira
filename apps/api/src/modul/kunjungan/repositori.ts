import { mulaiAntreanDalam, selesaiAntreanDalam } from './antrean-otomatis';
import { prisma, Prisma } from '@klira/db';
import { TAHAP_BERJALAN, kodeAntrean, tanggalWib } from '@klira/shared';
import type { AksiAntrean, AntreanDto, FilterAntrean, KunjunganDto, KunjunganMasukan, OpsiKunjunganDto, StatusAntrean, TahapLayanan } from '@klira/shared';
import { statusDariDb } from './pemetaan';

export type DataKunjungan = Omit<KunjunganMasukan, 'nomor_sep' | 'keluhan_singkat'> & { nomor_sep: string | null; keluhan_singkat: string | null };

export interface RepositoriKunjungan {
  pasienAda(fasyankesId: number, id: number): Promise<boolean>;
  kunjunganBerjalan(fasyankesId: number, pasienId: number): Promise<boolean>;
  poliOperasional(fasyankesId: number, id: number): Promise<boolean>;
  dpjpSah(fasyankesId: number, penggunaId: number): Promise<boolean>;
  opsi(fasyankesId: number): Promise<OpsiKunjunganDto>;
  /** Kunjungan, peserta DPJP (ATND), dan antrean (rawat jalan) dibuat dalam satu transaksi. */
  daftarkan(fasyankesId: number, oleh: number, d: DataKunjungan, sekarang: Date): Promise<KunjunganDto>;
  tahapSekarang(fasyankesId: number, id: number): Promise<TahapLayanan | null>;
  /** Pindah tahap hanya bila masih di tahap `dari` (aman dari balapan); null bila sudah berubah. */
  ubahTahap(fasyankesId: number, id: number, dari: TahapLayanan, ke: TahapLayanan): Promise<KunjunganDto | null>;
  statusAntrean(fasyankesId: number, id: number): Promise<StatusAntrean | null>;
  ubahAntrean(fasyankesId: number, id: number, aksi: AksiAntrean, dari: readonly StatusAntrean[], ke: StatusAntrean, waktu: Date): Promise<AntreanDto | null>;
  daftarAntrean(fasyankesId: number, f: FilterAntrean & { tanggal: string }): Promise<{ total: number; baris: AntreanDto[] }>;
}

const tglDb = (t: string): Date => new Date(`${t}T00:00:00.000Z`);
const MAKS_ULANG_NOMOR = 5;

/** Pasien sudah punya kunjungan berjalan (terdeteksi di dalam transaksi, aman dari pendaftaran serempak). */
export class KunjunganBerjalanError extends Error {
  constructor() {
    super('kunjungan berjalan');
  }
}

/** Bentrok yang aman diulang: keunikan nomor antrean (P2002), serialisasi/deadlock (P2034). */
export const bisaDiulang = (e: unknown): boolean => e instanceof Prisma.PrismaClientKnownRequestError && (e.code === 'P2002' || e.code === 'P2034');

export type BarisKunjungan = Awaited<ReturnType<typeof ambilKunjungan>>;
export const ambilKunjungan = (tx: Prisma.TransactionClient | typeof prisma, id: number) =>
  tx.kunjungan.findUniqueOrThrow({ where: { id }, include: { antrean: true, peserta: { where: { tipe: 'ATND' }, orderBy: { id: 'asc' }, take: 1 } } });

export const keDto = (k: BarisKunjungan): KunjunganDto => ({
  id: k.id, pasien_id: k.pasien_id, jenis: k.jenis, status: statusDariDb(k.status), tahap_layanan: k.tahap_layanan, cara_pembayaran: k.cara_pembayaran,
  nomor_sep: k.nomor_sep, lokasi_id: k.lokasi_id, dpjp_id: k.peserta[0]?.pengguna_id ?? null, keluhan_singkat: k.keluhan_singkat, mulai: k.mulai.toISOString(),
  antrean: k.antrean ? { id: k.antrean.id, nomor: k.antrean.nomor, kode: kodeAntrean(k.antrean.nomor), status: k.antrean.status } : null,
});

export class RepositoriKunjunganPrisma implements RepositoriKunjungan {
  async pasienAda(fasyankesId: number, id: number): Promise<boolean> {
    return (await prisma.pasien.count({ where: { id, fasyankes_id: fasyankesId } })) > 0;
  }

  async kunjunganBerjalan(fasyankesId: number, pasienId: number): Promise<boolean> {
    return (await prisma.kunjungan.count({ where: { fasyankes_id: fasyankesId, pasien_id: pasienId, tahap_layanan: { in: [...TAHAP_BERJALAN] }, NOT: { antrean: { is: { status: 'batal' } } } } })) > 0;
  }

  async poliOperasional(fasyankesId: number, id: number): Promise<boolean> {
    return (await prisma.lokasi.count({ where: { id, fasyankes_id: fasyankesId, jenis: 'poli', status_operasional: 'O' } })) > 0;
  }

  async dpjpSah(fasyankesId: number, penggunaId: number): Promise<boolean> {
    return (await prisma.pengguna.count({ where: { id: penggunaId, fasyankes_id: fasyankesId, aktif: true, profil_profesi: { some: { aktif: true } } } })) > 0;
  }

  async opsi(fasyankesId: number): Promise<OpsiKunjunganDto> {
    const [poli, praktisi, jadwal] = await Promise.all([
      prisma.lokasi.findMany({ where: { fasyankes_id: fasyankesId, jenis: 'poli', status_operasional: 'O' }, orderBy: { nama: 'asc' }, select: { id: true, nama: true }, take: 500 }),
      prisma.pengguna.findMany({
        where: { fasyankes_id: fasyankesId, aktif: true, profil_profesi: { some: { aktif: true } } }, orderBy: { nama: 'asc' }, take: 500,
        select: { id: true, nama: true, profil_profesi: { where: { aktif: true }, select: { profesi: true }, take: 1 } },
      }),
      prisma.jadwalPraktik.findMany({ where: { fasyankes_id: fasyankesId, aktif: true }, select: { pengguna_id: true, lokasi_id: true } }),
    ]);
    return {
      poli,
      dpjp: praktisi.map((p) => ({
        id: p.id, nama: p.nama, profesi: p.profil_profesi[0]?.profesi ?? '',
        poli_ids: [...new Set(jadwal.filter((j) => j.pengguna_id === p.id).map((j) => j.lokasi_id))],
      })),
    };
  }

  async daftarkan(fasyankesId: number, oleh: number, d: DataKunjungan, sekarang: Date): Promise<KunjunganDto> {
    const tanggal = tglDb(tanggalWib(sekarang));
    // Nomor antrean = urutan berikutnya per poli per hari; bentrok keunikan (pendaftaran serempak) diulang.
    for (let percobaan = 1; ; percobaan++) {
      try {
        return await prisma.$transaction(async (tx) => {
          // Kunci baris pasien: pendaftaran serempak pasien yang sama berurutan, sehingga cek di bawah atomik dengan pembuatan.
          await tx.$queryRaw`SELECT id FROM pasien WHERE id = ${d.pasien_id} AND fasyankes_id = ${fasyankesId} FOR UPDATE`;
          const berjalan = await tx.kunjungan.count({ where: { fasyankes_id: fasyankesId, pasien_id: d.pasien_id, tahap_layanan: { in: [...TAHAP_BERJALAN] }, NOT: { antrean: { is: { status: 'batal' } } } } });
          if (berjalan > 0) throw new KunjunganBerjalanError();
          const k = await tx.kunjungan.create({
            data: {
              fasyankes_id: fasyankesId, pasien_id: d.pasien_id, jenis: d.jenis, status: 'arrived', tahap_layanan: 'menunggu_skrining', lokasi_id: d.jenis === 'AMB' ? d.lokasi_id ?? null : null,
              cara_pembayaran: d.cara_pembayaran, nomor_sep: d.nomor_sep, keluhan_singkat: d.keluhan_singkat, mulai: sekarang, dibuat_oleh: oleh,
            },
          });
          if (d.dpjp_id) await tx.pesertaKunjungan.create({ data: { fasyankes_id: fasyankesId, kunjungan_id: k.id, pengguna_id: d.dpjp_id, tipe: 'ATND', mulai: sekarang, dibuat_oleh: oleh } });
          if (d.jenis === 'AMB' && d.lokasi_id) {
            const maks = await tx.antrean.aggregate({ _max: { nomor: true }, where: { fasyankes_id: fasyankesId, lokasi_id: d.lokasi_id, tanggal } });
            await tx.antrean.create({
              data: { fasyankes_id: fasyankesId, kunjungan_id: k.id, lokasi_id: d.lokasi_id, tanggal, nomor: (maks._max.nomor ?? 0) + 1, status: 'menunggu', waktu_daftar: sekarang, dibuat_oleh: oleh },
            });
          }
          return keDto(await ambilKunjungan(tx, k.id));
        });
      } catch (e) {
        if (!bisaDiulang(e) || percobaan >= MAKS_ULANG_NOMOR) throw e;
      }
    }
  }

  async tahapSekarang(fasyankesId: number, id: number): Promise<TahapLayanan | null> {
    return (await prisma.kunjungan.findFirst({ where: { id, fasyankes_id: fasyankesId }, select: { tahap_layanan: true } }))?.tahap_layanan ?? null;
  }

  async ubahTahap(fasyankesId: number, id: number, dari: TahapLayanan, ke: TahapLayanan): Promise<KunjunganDto | null> {
    return prisma.$transaction(async (tx) => {
      const n = await tx.kunjungan.updateMany({ where: { id, fasyankes_id: fasyankesId, tahap_layanan: dari }, data: { tahap_layanan: ke } });
      if (n.count !== 1) return null;
      const waktu = new Date();
      if (ke === 'pemeriksaan') await mulaiAntreanDalam(tx, fasyankesId, id, waktu);
      if (dari === 'pemeriksaan' && (ke === 'resep' || ke === 'kasir')) await selesaiAntreanDalam(tx, fasyankesId, id, waktu);
      return keDto(await ambilKunjungan(tx, id));
    });
  }

  async statusAntrean(fasyankesId: number, id: number): Promise<StatusAntrean | null> {
    return (await prisma.antrean.findFirst({ where: { id, fasyankes_id: fasyankesId }, select: { status: true } }))?.status ?? null;
  }

  async ubahAntrean(fasyankesId: number, id: number, aksi: AksiAntrean, dari: readonly StatusAntrean[], ke: StatusAntrean, waktu: Date): Promise<AntreanDto | null> {
    const waktuData: Prisma.AntreanUpdateManyMutationInput =
      aksi === 'panggil' ? { waktu_panggil: waktu } : aksi === 'mulai' ? { waktu_mulai: waktu } : { waktu_selesai: waktu };
    const hasil = await prisma.$transaction(async (tx) => {
      // Serialisasi panggilan per fasilitas agar urutan ID event mengikuti urutan commit.
      if (aksi === 'panggil') await tx.$queryRaw`SELECT id FROM fasyankes WHERE id = ${fasyankesId} FOR UPDATE`;
      const n = await tx.antrean.updateMany({ where: { id, fasyankes_id: fasyankesId, status: { in: [...dari] } }, data: { status: ke, ...waktuData } });
      if (n.count !== 1) return false;
      if (aksi === 'panggil') {
        const a = await tx.antrean.findUniqueOrThrow({ where: { id }, select: { lokasi_id: true, nomor: true, tanggal: true } });
        const poli = await tx.lokasi.findFirstOrThrow({ where: { id: a.lokasi_id, fasyankes_id: fasyankesId }, select: { nama: true } });
        // Event dan perubahan status berada dalam transaksi yang sama, termasuk panggil ulang.
        await tx.eventPanggilan.create({ data: { fasyankes_id: fasyankesId, poli_id: a.lokasi_id, poli_nama: poli.nama, kode: kodeAntrean(a.nomor), tanggal: a.tanggal, waktu_panggil: waktu } });
      }
      if (aksi === 'mulai') {
        const a = await tx.antrean.findUniqueOrThrow({ where: { id }, select: { kunjungan_id: true } });
        await tx.kunjungan.updateMany({ where: { id: a.kunjungan_id, fasyankes_id: fasyankesId, status: { in: ['planned', 'arrived'] } }, data: { status: 'in_progress' } });
      }
      return true;
    });
    if (!hasil) return null;
    return (await this.petakanAntrean(fasyankesId, { id }))[0] ?? null;
  }

  async daftarAntrean(fasyankesId: number, f: FilterAntrean & { tanggal: string }): Promise<{ total: number; baris: AntreanDto[] }> {
    const where: Prisma.AntreanWhereInput = { fasyankes_id: fasyankesId, tanggal: tglDb(f.tanggal), ...(f.lokasi_id ? { lokasi_id: f.lokasi_id } : {}), ...(f.status ? { status: f.status } : {}) };
    const [total, baris] = await Promise.all([
      prisma.antrean.count({ where }),
      this.petakanAntrean(fasyankesId, where, { skip: (f.halaman - 1) * f.ukuran, take: f.ukuran }),
    ]);
    return { total, baris };
  }

  private async petakanAntrean(fasyankesId: number, where: Prisma.AntreanWhereInput, halaman?: { skip: number; take: number }): Promise<AntreanDto[]> {
    const data = await prisma.antrean.findMany({
      where: { ...where, fasyankes_id: fasyankesId }, orderBy: [{ lokasi_id: 'asc' }, { nomor: 'asc' }], ...halaman,
      include: { kunjungan: { select: { pasien_id: true } } },
    });
    const pasien = new Map((await prisma.pasien.findMany({ where: { fasyankes_id: fasyankesId, id: { in: data.map((a) => a.kunjungan.pasien_id) } }, select: { id: true, nama: true, nomor_rm: true } })).map((p) => [p.id, p]));
    const poli = new Map((await prisma.lokasi.findMany({ where: { fasyankes_id: fasyankesId, id: { in: [...new Set(data.map((a) => a.lokasi_id))] } }, select: { id: true, nama: true } })).map((l) => [l.id, l.nama]));
    return data.map((a) => ({
      id: a.id, kunjungan_id: a.kunjungan_id, lokasi_id: a.lokasi_id, poli_nama: poli.get(a.lokasi_id) ?? null, tanggal: a.tanggal.toISOString().slice(0, 10), nomor: a.nomor,
      kode: kodeAntrean(a.nomor), status: a.status, waktu_daftar: a.waktu_daftar.toISOString(), waktu_panggil: a.waktu_panggil?.toISOString() ?? null,
      pasien_nama: pasien.get(a.kunjungan.pasien_id)?.nama ?? '', pasien_nomor_rm: pasien.get(a.kunjungan.pasien_id)?.nomor_rm ?? '',
    }));
  }
}
