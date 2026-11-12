import { prisma } from '@klira/db';
import type { Prisma } from '@klira/db';
import type { BagianKlinis, BerkasBarisDto, FilterBerkas, FilterPerbaikan, HalamanBerkasDto, HalamanPerbaikanDto, PermintaanPerbaikanDto, StatusPerbaikan } from '@klira/shared';

export type KunjunganRm = { id: number; pasien_id: number; pasien_nama: string; pasien_nomor_rm: string; tahap_layanan: string; jenis: 'AMB' | 'IMP'; waktu_tutup: Date | null; diarsipkan_pada: Date | null; retensi_sampai: Date | null };
export type PermintaanBaris = { id: number; kunjungan_id: number; bagian: BagianKlinis; isi_baru: unknown; alasan: string; pemohon_id: number; status: StatusPerbaikan };

const tglIso = (d: Date): string => d.toISOString().slice(0, 10);
const rentangWib = (tanggal: string): Date => new Date(`${tanggal}T00:00:00.000+07:00`);

/** Akses data Rekam medis: permintaan perbaikan, daftar berkas. Hanya INSERT/UPDATE terkontrol; tidak ada hapus. */
export class RepositoriRmPrisma {
  async kunjungan(fasyankesId: number, id: number): Promise<KunjunganRm | null> {
    const k = await prisma.kunjungan.findFirst({ where: { id, fasyankes_id: fasyankesId }, include: { pasien: { select: { nama: true, nomor_rm: true } } } });
    return k && {
      id: k.id, pasien_id: k.pasien_id, pasien_nama: k.pasien.nama, pasien_nomor_rm: k.pasien.nomor_rm, tahap_layanan: k.tahap_layanan, jenis: k.jenis, waktu_tutup: k.waktu_tutup,
      diarsipkan_pada: k.diarsipkan_pada, retensi_sampai: k.retensi_sampai,
    };
  }

  // ---- Permintaan perbaikan ----
  adaMenunggu(fasyankesId: number, kunjunganId: number, bagian: string): Promise<boolean> {
    return prisma.permintaanPerbaikan.count({ where: { fasyankes_id: fasyankesId, kunjungan_id: kunjunganId, bagian, status: 'diajukan' } }).then((n) => n > 0);
  }

  async buatPermintaan(d: { fasyankesId: number; kunjunganId: number; bagian: BagianKlinis; isi: unknown; alasan: string; pemohonId: number }): Promise<number> {
    return (await prisma.permintaanPerbaikan.create({
      data: { fasyankes_id: d.fasyankesId, kunjungan_id: d.kunjunganId, bagian: d.bagian, isi_baru: d.isi as Prisma.InputJsonValue, alasan: d.alasan, pemohon_id: d.pemohonId },
    })).id;
  }

  async permintaan(fasyankesId: number, id: number): Promise<PermintaanBaris | null> {
    const p = await prisma.permintaanPerbaikan.findFirst({ where: { id, fasyankes_id: fasyankesId } });
    return p && { id: p.id, kunjungan_id: p.kunjungan_id, bagian: p.bagian as BagianKlinis, isi_baru: p.isi_baru, alasan: p.alasan, pemohon_id: p.pemohon_id, status: p.status };
  }

  /** Klaim keputusan secara atomik: hanya bila masih diajukan (dua penyetuju serempak tidak sama-sama berhasil). */
  async putuskan(fasyankesId: number, id: number, status: 'disetujui' | 'ditolak', penyetujuId: number, catatan: string | null): Promise<boolean> {
    const r = await prisma.permintaanPerbaikan.updateMany({ where: { id, fasyankes_id: fasyankesId, status: 'diajukan' }, data: { status, penyetuju_id: penyetujuId, catatan_keputusan: catatan, waktu_keputusan: new Date() } });
    return r.count > 0;
  }

  /** Membatalkan klaim bila penerapan isi gagal sehingga permintaan dapat ditinjau lagi. */
  async kembalikan(fasyankesId: number, id: number): Promise<void> {
    await prisma.permintaanPerbaikan.updateMany({ where: { id, fasyankes_id: fasyankesId, status: { not: 'diajukan' } }, data: { status: 'diajukan', penyetuju_id: null, catatan_keputusan: null, waktu_keputusan: null } });
  }

  async daftarPermintaan(fasyankesId: number, f: FilterPerbaikan, bacaIsi: (kunjunganId: number, bagian: BagianKlinis) => Promise<unknown>): Promise<HalamanPerbaikanDto> {
    const where: Prisma.PermintaanPerbaikanWhereInput = { fasyankes_id: fasyankesId, ...(f.status ? { status: f.status } : {}) };
    const [total, menunggu, baris] = await Promise.all([
      prisma.permintaanPerbaikan.count({ where }),
      prisma.permintaanPerbaikan.count({ where: { fasyankes_id: fasyankesId, status: 'diajukan' } }),
      prisma.permintaanPerbaikan.findMany({ where, orderBy: { id: 'desc' }, skip: (f.halaman - 1) * f.ukuran, take: f.ukuran }),
    ]);
    const kunj = await prisma.kunjungan.findMany({ where: { id: { in: [...new Set(baris.map((b) => b.kunjungan_id))] } }, include: { pasien: { select: { nama: true, nomor_rm: true } } } });
    const orang = new Map((await prisma.pengguna.findMany({ where: { id: { in: [...new Set(baris.flatMap((b) => [b.pemohon_id, ...(b.penyetuju_id ? [b.penyetuju_id] : [])]))] } }, select: { id: true, nama: true } })).map((u) => [u.id, u.nama]));
    const data: PermintaanPerbaikanDto[] = [];
    for (const b of baris) {
      const k = kunj.find((x) => x.id === b.kunjungan_id);
      data.push({
        id: b.id, kunjungan_id: b.kunjungan_id, pasien_nama: k?.pasien.nama ?? '-', pasien_nomor_rm: k?.pasien.nomor_rm ?? '-', bagian: b.bagian as BagianKlinis, isi_baru: b.isi_baru,
        isi_sekarang: b.status === 'diajukan' ? await bacaIsi(b.kunjungan_id, b.bagian as BagianKlinis) : null, alasan: b.alasan, pemohon_nama: orang.get(b.pemohon_id) ?? null, status: b.status,
        penyetuju_nama: b.penyetuju_id ? orang.get(b.penyetuju_id) ?? null : null, catatan_keputusan: b.catatan_keputusan, waktu_keputusan: b.waktu_keputusan?.toISOString() ?? null, dibuat_pada: b.dibuat_pada.toISOString(),
      });
    }
    return { data, halaman: f.halaman, ukuran: f.ukuran, total, menunggu };
  }

  // ---- Daftar berkas (kunjungan ditutup) ----
  async berkas(fasyankesId: number, f: FilterBerkas, ringkasDokter: (kunjunganIds: number[]) => Promise<Map<number, string | null>>): Promise<HalamanBerkasDto> {
    const cari = f.cari?.trim();
    const where: Prisma.KunjunganWhereInput = {
      fasyankes_id: fasyankesId, tahap_layanan: 'ditutup',
      ...(cari ? { pasien: { OR: [{ nama: { contains: cari } }, { nomor_rm: { contains: cari } }, { nik: { contains: cari } }] } } : {}),
      ...(f.dari || f.sampai ? { waktu_tutup: { ...(f.dari ? { gte: rentangWib(f.dari) } : {}), ...(f.sampai ? { lt: new Date(rentangWib(f.sampai).getTime() + 86_400_000) } : {}) } } : {}),
    };
    const [total, baris] = await Promise.all([
      prisma.kunjungan.count({ where }),
      prisma.kunjungan.findMany({ where, include: { pasien: { select: { nama: true, nomor_rm: true } } }, orderBy: { id: 'desc' }, skip: (f.halaman - 1) * f.ukuran, take: f.ukuran }),
    ]);
    const ids = baris.map((b) => b.id);
    const dokter = await ringkasDokter(ids);
    const menunggu = await prisma.permintaanPerbaikan.groupBy({ by: ['kunjungan_id'], where: { fasyankes_id: fasyankesId, status: 'diajukan', kunjungan_id: { in: ids } }, _count: { _all: true } });
    const data: BerkasBarisDto[] = baris.map((b) => ({
      kunjungan_id: b.id, pasien_id: b.pasien_id, pasien_nama: b.pasien.nama, pasien_nomor_rm: b.pasien.nomor_rm, waktu_tutup: b.waktu_tutup?.toISOString() ?? null, jenis: b.jenis,
      diagnosis_dokter: dokter.get(b.id) ?? null,
      diarsipkan_pada: b.diarsipkan_pada?.toISOString() ?? null, retensi_sampai: b.retensi_sampai ? tglIso(b.retensi_sampai) : null, perbaikan_menunggu: menunggu.find((m) => m.kunjungan_id === b.id)?._count._all ?? 0,
    }));
    return { data, halaman: f.halaman, ukuran: f.ukuran, total };
  }
}
