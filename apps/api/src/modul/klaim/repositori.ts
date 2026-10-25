import { prisma, Prisma } from '@klira/db';
import type { FilterKlaim, KodeKlaim, RingkasanKlaimDto, StatusKlaim } from '@klira/shared';
import { STATUS_KLAIM } from '@klira/shared';

export type KunjunganKlaim = {
  id: number; pasien_id: number; pasien_nama: string; pasien_nomor_rm: string; jenis: 'AMB' | 'IMP'; tahap_layanan: string; cara_pembayaran: 'umum' | 'jkn'; nomor_sep: string | null; spri: string | null; waktu_tutup: Date | null;
};
export type KlaimBaris = {
  id: number; kunjungan_id: number; nomor_sep: string | null; status: StatusKlaim; tanggal_selesai: Date; batas_pengajuan: Date; diagnosis: KodeKlaim[]; tindakan: KodeKlaim[]; berkas: string[]; catatan: string | null;
  diajukan_pada: Date | null; dikembalikan_pada: Date | null; berita_acara: string | null; batas_ajukan_ulang: Date | null; alasan: string | null; jumlah_dibayar: number | null; dibayar_pada: Date | null;
};
export type RiwayatBaris = { klaim_id: number; dari: StatusKlaim | null; ke: StatusKlaim; alasan: string | null; oleh: number; waktu: Date };
export type DataBaruKlaim = { fasyankesId: number; kunjunganId: number; nomorSep: string | null; status: StatusKlaim; tanggalSelesai: Date; batas: Date; diagnosis: KodeKlaim[]; tindakan: KodeKlaim[]; berkas: string[]; catatan: string | null; oleh: number };
export type PerubahanStatus = Partial<Pick<KlaimBaris, 'diajukan_pada' | 'dikembalikan_pada' | 'berita_acara' | 'batas_ajukan_ulang' | 'alasan' | 'jumlah_dibayar' | 'dibayar_pada'>>;

/** Penolakan aturan yang terdeteksi saat menulis (keunikan klaim per kunjungan, status berubah di antara baca dan tulis). */
export class GalatKlaim extends Error {
  constructor(public readonly kode: 'sudah_ada' | 'bentrok') {
    super(kode);
  }
}

const dariDb = (k: { id: number; kunjungan_id: number; nomor_sep: string | null; status: StatusKlaim; tanggal_selesai: Date; batas_pengajuan: Date; diagnosis: unknown; tindakan: unknown; berkas: unknown; catatan: string | null; diajukan_pada: Date | null; dikembalikan_pada: Date | null; berita_acara: string | null; batas_ajukan_ulang: Date | null; alasan: string | null; jumlah_dibayar: number | null; dibayar_pada: Date | null }): KlaimBaris => ({
  ...k, diagnosis: k.diagnosis as KodeKlaim[], tindakan: k.tindakan as KodeKlaim[], berkas: k.berkas as string[],
});

/**
 * Kondisi basis data untuk status efektif: lewat batas waktu mencakup yang tersimpan sebagai lewat batas dan yang belum diajukan melewati batas pengajuan
 * atau dikembalikan melewati batas ajukan ulang; status lain tidak termasuk yang sudah melewati batas itu.
 */
function kondisiStatus(status: StatusKlaim, sekarang: Date): Prisma.KlaimWhereInput {
  const lewat: Prisma.KlaimWhereInput = { OR: [{ status: 'lewat_batas_waktu' }, { status: { in: ['menunggu_sep', 'siap_diajukan'] }, batas_pengajuan: { lt: sekarang } }, { status: 'dikembalikan', batas_ajukan_ulang: { lt: sekarang } }] };
  if (status === 'lewat_batas_waktu') return lewat;
  if (status === 'menunggu_sep' || status === 'siap_diajukan') return { status, batas_pengajuan: { gte: sekarang } };
  if (status === 'dikembalikan') return { status, OR: [{ batas_ajukan_ulang: null }, { batas_ajukan_ulang: { gte: sekarang } }] };
  return { status };
}

/** Akses data klaim JKN/BPJS. Hanya INSERT dan pembaruan status berpagar (status asal harus sama); riwayat status hanya ditambah; tidak ada hapus. */
export class RepositoriKlaimPrisma {
  async kunjungan(fasyankesId: number, id: number): Promise<KunjunganKlaim | null> {
    const k = await prisma.kunjungan.findFirst({ where: { id, fasyankes_id: fasyankesId }, include: { pasien: { select: { nama: true, nomor_rm: true } } } });
    return k && { id: k.id, pasien_id: k.pasien_id, pasien_nama: k.pasien.nama, pasien_nomor_rm: k.pasien.nomor_rm, jenis: k.jenis, tahap_layanan: k.tahap_layanan, cara_pembayaran: k.cara_pembayaran, nomor_sep: k.nomor_sep, spri: k.spri, waktu_tutup: k.waktu_tutup };
  }

  async kunjunganBanyak(fasyankesId: number, ids: number[]): Promise<Map<number, KunjunganKlaim>> {
    const baris = await prisma.kunjungan.findMany({ where: { fasyankes_id: fasyankesId, id: { in: ids } }, include: { pasien: { select: { nama: true, nomor_rm: true } } } });
    return new Map(baris.map((k) => [k.id, { id: k.id, pasien_id: k.pasien_id, pasien_nama: k.pasien.nama, pasien_nomor_rm: k.pasien.nomor_rm, jenis: k.jenis, tahap_layanan: k.tahap_layanan, cara_pembayaran: k.cara_pembayaran, nomor_sep: k.nomor_sep, spri: k.spri, waktu_tutup: k.waktu_tutup }]));
  }

  /** Kunjungan JKN yang sudah ditutup dan belum punya klaim, terbaru lebih dulu. */
  async kandidat(fasyankesId: number, batas = 200): Promise<KunjunganKlaim[]> {
    const ids = (await prisma.$queryRaw<{ id: number }[]>`SELECT k.id FROM kunjungan k WHERE k.fasyankes_id = ${fasyankesId} AND k.cara_pembayaran = 'jkn' AND k.tahap_layanan = 'ditutup' AND NOT EXISTS (SELECT 1 FROM klaim c WHERE c.kunjungan_id = k.id) ORDER BY k.id DESC LIMIT ${batas}`).map((r) => r.id);
    const peta = await this.kunjunganBanyak(fasyankesId, ids);
    return ids.flatMap((id) => (peta.has(id) ? [peta.get(id)!] : []));
  }

  async klaim(fasyankesId: number, id: number): Promise<KlaimBaris | null> {
    const k = await prisma.klaim.findFirst({ where: { id, fasyankes_id: fasyankesId } });
    return k && dariDb(k);
  }

  async ringkasan(fasyankesId: number, sekarang: Date): Promise<RingkasanKlaimDto> {
    const hasil = await Promise.all(STATUS_KLAIM.nilai.map(async (s) => [s, await prisma.klaim.count({ where: { fasyankes_id: fasyankesId, ...kondisiStatus(s, sekarang) } })] as const));
    return Object.fromEntries(hasil) as RingkasanKlaimDto;
  }

  async daftar(fasyankesId: number, f: FilterKlaim, sekarang: Date): Promise<{ total: number; baris: KlaimBaris[] }> {
    const cari = f.cari?.trim();
    const cocok = cari
      ? [{ nomor_sep: { contains: cari } }, { kunjungan_id: { in: (await prisma.kunjungan.findMany({ where: { fasyankes_id: fasyankesId, pasien: { OR: [{ nama: { contains: cari } }, { nomor_rm: { contains: cari } }] } }, select: { id: true }, take: 1000 })).map((k) => k.id) } }]
      : null;
    const where: Prisma.KlaimWhereInput = { AND: [{ fasyankes_id: fasyankesId }, ...(f.status ? [kondisiStatus(f.status, sekarang)] : []), ...(cocok ? [{ OR: cocok }] : [])] };
    const [total, baris] = await Promise.all([prisma.klaim.count({ where }), prisma.klaim.findMany({ where, orderBy: [{ batas_pengajuan: 'asc' }, { id: 'asc' }], skip: (f.halaman - 1) * f.ukuran, take: f.ukuran })]);
    return { total, baris: baris.map(dariDb) };
  }

  async riwayat(fasyankesId: number, klaimIds: number[]): Promise<RiwayatBaris[]> {
    return prisma.riwayatKlaim.findMany({ where: { fasyankes_id: fasyankesId, klaim_id: { in: klaimIds } }, orderBy: { id: 'asc' } });
  }

  async namaPengguna(ids: number[]): Promise<Map<number, string>> {
    return new Map((await prisma.pengguna.findMany({ where: { id: { in: [...new Set(ids)] } }, select: { id: true, nama: true } })).map((u) => [u.id, u.nama]));
  }

  async buat(d: DataBaruKlaim): Promise<number> {
    try {
      return await prisma.$transaction(async (tx) => {
        const k = await tx.klaim.create({
          data: {
            fasyankes_id: d.fasyankesId, kunjungan_id: d.kunjunganId, nomor_sep: d.nomorSep, status: d.status, tanggal_selesai: d.tanggalSelesai, batas_pengajuan: d.batas, diagnosis: d.diagnosis as unknown as Prisma.InputJsonValue,
            tindakan: d.tindakan as unknown as Prisma.InputJsonValue, berkas: d.berkas, catatan: d.catatan, dibuat_oleh: d.oleh,
          },
        });
        await tx.riwayatKlaim.create({ data: { fasyankes_id: d.fasyankesId, klaim_id: k.id, dari: null, ke: d.status, oleh: d.oleh } });
        return k.id;
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') throw new GalatKlaim('sudah_ada');
      throw e;
    }
  }

  /** Ubah SEP, berkas, dan catatan (status ikut bila berubah) hanya bila status tersimpan masih `dari`. */
  async ubahBerkas(fasyankesId: number, id: number, dari: StatusKlaim, d: { nomorSep: string | null; berkas: string[]; catatan: string | null; status: StatusKlaim; oleh: number }): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const n = await tx.klaim.updateMany({ where: { id, fasyankes_id: fasyankesId, status: dari }, data: { nomor_sep: d.nomorSep, berkas: d.berkas, catatan: d.catatan, status: d.status, diperbarui_pada: new Date() } });
      if (n.count !== 1) throw new GalatKlaim('bentrok');
      if (d.status !== dari) await tx.riwayatKlaim.create({ data: { fasyankes_id: fasyankesId, klaim_id: id, dari, ke: d.status, oleh: d.oleh } });
    });
  }

  /** Pindah status secara atomik: hanya bila status tersimpan masih `dari` (dua petugas serempak tidak sama-sama berhasil). */
  async ubahStatus(fasyankesId: number, id: number, dari: StatusKlaim, ke: StatusKlaim, d: PerubahanStatus, oleh: number, alasanRiwayat: string | null): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const n = await tx.klaim.updateMany({ where: { id, fasyankes_id: fasyankesId, status: dari }, data: { ...d, status: ke, diperbarui_pada: new Date() } });
      if (n.count !== 1) throw new GalatKlaim('bentrok');
      await tx.riwayatKlaim.create({ data: { fasyankes_id: fasyankesId, klaim_id: id, dari, ke, alasan: alasanRiwayat, oleh } });
    });
  }
}
