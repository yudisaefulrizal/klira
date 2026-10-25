import { prisma, Prisma } from '@klira/db';
import { batasPdp } from '@klira/shared';
import type {
  DpiaMasukan, FilterHak, FilterPersetujuanPdp, HakMasukan, InsidenMasukan, PemberitahuanMasukan, PemusnahanMasukan, ProsesorMasukan, RopaMasukan, StatusHak, StatusMusnah,
} from '@klira/shared';

export const awalHariWib = (d: Date): Date => new Date(`${new Date(d.getTime() + 7 * 3_600_000).toISOString().slice(0, 10)}T00:00:00.000+07:00`);

/** Penolakan aturan yang terdeteksi saat menulis (status berubah di antara baca dan tulis, penarikan ganda). */
export class GalatPdp extends Error {
  constructor(public readonly kode: 'bentrok' | 'sudah_ditarik') {
    super(kode);
  }
}
const bentrokP2002 = (e: unknown) => e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002';

export type HakBaris = Awaited<ReturnType<typeof prisma.permintaanHak.findFirstOrThrow>>;
export type PasienMini = { id: number; nama: string; nomor_rm: string };

/** Akses data pelindungan data pribadi. Pembaruan status berpagar (status asal harus sama); tidak ada hapus. */
export class RepositoriPdpPrisma {
  async pasien(fasyankesId: number, id: number): Promise<PasienMini | null> {
    return prisma.pasien.findFirst({ where: { id, fasyankes_id: fasyankesId }, select: { id: true, nama: true, nomor_rm: true } });
  }
  async pasienBanyak(fasyankesId: number, ids: number[]): Promise<Map<number, PasienMini>> {
    return new Map((await prisma.pasien.findMany({ where: { fasyankes_id: fasyankesId, id: { in: [...new Set(ids)] } }, select: { id: true, nama: true, nomor_rm: true } })).map((p) => [p.id, p]));
  }
  async namaPengguna(ids: number[]): Promise<Map<number, string>> {
    return new Map((await prisma.pengguna.findMany({ where: { id: { in: [...new Set(ids)] } }, select: { id: true, nama: true } })).map((u) => [u.id, u.nama]));
  }

  // ---- Permintaan hak ----
  async buatHak(fasyankesId: number, m: HakMasukan, oleh: number, sekarang: Date): Promise<number> {
    return (await prisma.permintaanHak.create({
      data: { fasyankes_id: fasyankesId, pasien_id: m.pasien_id, jenis: m.jenis, saluran: m.saluran, pemohon_nama: m.pemohon_nama, pemohon_hubungan: m.pemohon_hubungan, verifikasi: m.verifikasi, rincian: m.rincian, diterima_pada: sekarang, batas_waktu: batasPdp(sekarang), dibuat_oleh: oleh },
    })).id;
  }
  async hak(fasyankesId: number, id: number): Promise<HakBaris | null> {
    return prisma.permintaanHak.findFirst({ where: { id, fasyankes_id: fasyankesId } });
  }
  async daftarHak(fasyankesId: number, f: FilterHak, sekarang: Date): Promise<{ total: number; baris: HakBaris[]; aktif: number; terlambat: number }> {
    const cari = f.cari?.trim();
    const pasienIds = cari ? (await prisma.pasien.findMany({ where: { fasyankes_id: fasyankesId, OR: [{ nama: { contains: cari } }, { nomor_rm: { contains: cari } }] }, select: { id: true }, take: 1000 })).map((p) => p.id) : [];
    const where: Prisma.PermintaanHakWhereInput = { fasyankes_id: fasyankesId, ...(f.status ? { status: f.status } : {}), ...(cari ? { OR: [{ pemohon_nama: { contains: cari } }, { pasien_id: { in: pasienIds } }] } : {}) };
    const [total, baris, aktif, terlambat] = await Promise.all([
      prisma.permintaanHak.count({ where }),
      prisma.permintaanHak.findMany({ where, orderBy: [{ batas_waktu: 'asc' }, { id: 'asc' }], skip: (f.halaman - 1) * f.ukuran, take: f.ukuran }),
      prisma.permintaanHak.count({ where: { fasyankes_id: fasyankesId, status: { not: 'selesai' } } }),
      prisma.permintaanHak.count({ where: { fasyankes_id: fasyankesId, status: { not: 'selesai' }, batas_waktu: { lt: sekarang } } }),
    ]);
    return { total, baris, aktif, terlambat };
  }
  /** Maju satu tahap hanya bila status tersimpan masih salah satu `dari` (dua petugas serempak tidak sama-sama berhasil). */
  async majuHak(fasyankesId: number, id: number, dari: readonly StatusHak[], ke: StatusHak, data: Prisma.PermintaanHakUpdateManyMutationInput): Promise<void> {
    const n = await prisma.permintaanHak.updateMany({ where: { id, fasyankes_id: fasyankesId, status: { in: [...dari] } }, data: { ...data, status: ke } });
    if (n.count !== 1) throw new GalatPdp('bentrok');
  }

  // ---- Teks pemberitahuan dan persetujuan ----
  async daftarTeksPdp(fasyankesId: number) {
    return prisma.teksPersetujuan.findMany({ where: { fasyankes_id: fasyankesId, jenis: 'PDP' }, orderBy: { versi: 'desc' }, take: 100 });
  }
  /** Versi berikutnya menggantikan yang berlaku (versi lama tetap tersimpan); penomoran dikunci agar versi tidak ganda. */
  async buatTeksPdp(fasyankesId: number, m: PemberitahuanMasukan, oleh: number): Promise<number> {
    for (let percobaan = 0; ; percobaan++) {
      try {
        return await prisma.$transaction(async (tx) => {
          const maks = await tx.teksPersetujuan.aggregate({ _max: { versi: true }, where: { fasyankes_id: fasyankesId, jenis: 'PDP' } });
          await tx.teksPersetujuan.updateMany({ where: { fasyankes_id: fasyankesId, jenis: 'PDP', aktif: true }, data: { aktif: false } });
          return (await tx.teksPersetujuan.create({ data: { fasyankes_id: fasyankesId, jenis: 'PDP', versi: (maks._max.versi ?? 0) + 1 + percobaan, judul: m.judul, tujuan: m.tujuan, isi: m.isi, aktif: true, dibuat_oleh: oleh } })).id;
        });
      } catch (e) {
        if (!(e instanceof Prisma.PrismaClientKnownRequestError) || percobaan >= 3) throw e;
      }
    }
  }
  async daftarPersetujuan(fasyankesId: number, f: FilterPersetujuanPdp) {
    const cari = f.cari?.trim();
    const pasienIds = cari ? (await prisma.pasien.findMany({ where: { fasyankes_id: fasyankesId, OR: [{ nama: { contains: cari } }, { nomor_rm: { contains: cari } }] }, select: { id: true }, take: 1000 })).map((p) => p.id) : [];
    const where: Prisma.PersetujuanWhereInput = { fasyankes_id: fasyankesId, jenis: { in: ['general', 'PDP'] }, ...(f.status ? { status: f.status } : {}), ...(cari ? { pasien_id: { in: pasienIds } } : {}) };
    const [total, baris] = await Promise.all([prisma.persetujuan.count({ where }), prisma.persetujuan.findMany({ where, orderBy: { id: 'desc' }, skip: (f.halaman - 1) * f.ukuran, take: f.ukuran })]);
    const tarik = await prisma.penarikanPersetujuan.findMany({ where: { persetujuan_id: { in: baris.map((b) => b.id) } } });
    return { total, baris, tarik };
  }
  async persetujuan(fasyankesId: number, id: number) {
    return prisma.persetujuan.findFirst({ where: { id, fasyankes_id: fasyankesId } });
  }
  async tarik(fasyankesId: number, persetujuanId: number, alasan: string, oleh: number, sekarang: Date): Promise<void> {
    try {
      await prisma.$transaction(async (tx) => {
        const n = await tx.persetujuan.updateMany({ where: { id: persetujuanId, fasyankes_id: fasyankesId, status: 'diberikan' }, data: { status: 'ditarik' } });
        if (n.count !== 1) throw new GalatPdp('sudah_ditarik');
        await tx.penarikanPersetujuan.create({ data: { fasyankes_id: fasyankesId, persetujuan_id: persetujuanId, alasan, waktu: sekarang, batas_henti: batasPdp(sekarang), dicatat_oleh: oleh } });
      });
    } catch (e) {
      if (bentrokP2002(e)) throw new GalatPdp('sudah_ditarik');
      throw e;
    }
  }

  // ---- ROPA ----
  async daftarRopa(fasyankesId: number, halaman: number, ukuran: number) {
    const where = { fasyankes_id: fasyankesId };
    const [total, baris] = await Promise.all([prisma.ropa.count({ where }), prisma.ropa.findMany({ where, orderBy: { id: 'desc' }, skip: (halaman - 1) * ukuran, take: ukuran })]);
    return { total, baris };
  }
  semuaRopa(fasyankesId: number) {
    return prisma.ropa.findMany({ where: { fasyankes_id: fasyankesId }, orderBy: { id: 'asc' }, take: 1000 });
  }
  async ropa(fasyankesId: number, id: number) {
    return prisma.ropa.findFirst({ where: { id, fasyankes_id: fasyankesId } });
  }
  async buatRopa(fasyankesId: number, m: RopaMasukan, oleh: number): Promise<number> {
    return (await prisma.ropa.create({ data: { fasyankes_id: fasyankesId, ...m, dibuat_oleh: oleh } })).id;
  }
  async ubahRopa(fasyankesId: number, id: number, m: RopaMasukan): Promise<boolean> {
    return (await prisma.ropa.updateMany({ where: { id, fasyankes_id: fasyankesId }, data: { ...m, diperbarui_pada: new Date() } })).count === 1;
  }

  // ---- DPIA ----
  async daftarDpia(fasyankesId: number, halaman: number, ukuran: number) {
    const where = { fasyankes_id: fasyankesId };
    const [total, baris] = await Promise.all([prisma.dpia.count({ where }), prisma.dpia.findMany({ where, orderBy: { tinjau_ulang_pada: 'asc' }, skip: (halaman - 1) * ukuran, take: ukuran })]);
    const ropa = new Map((await prisma.ropa.findMany({ where: { fasyankes_id: fasyankesId, id: { in: baris.flatMap((b) => (b.ropa_id ? [b.ropa_id] : [])) } }, select: { id: true, nama_kegiatan: true } })).map((r) => [r.id, r.nama_kegiatan]));
    return { total, baris, ropa };
  }
  async dpia(fasyankesId: number, id: number) {
    return prisma.dpia.findFirst({ where: { id, fasyankes_id: fasyankesId } });
  }
  async ropaAda(fasyankesId: number, id: number): Promise<boolean> {
    return (await prisma.ropa.count({ where: { id, fasyankes_id: fasyankesId } })) > 0;
  }
  async buatDpia(fasyankesId: number, m: DpiaMasukan, oleh: number, sekarang: Date): Promise<number> {
    const { tandai_ditinjau, tinjau_ulang_pada, ...isi } = m;
    return (await prisma.dpia.create({ data: { fasyankes_id: fasyankesId, ...isi, tinjau_ulang_pada: new Date(`${tinjau_ulang_pada}T00:00:00.000Z`), ditinjau_pada: tandai_ditinjau ? sekarang : null, dibuat_oleh: oleh } })).id;
  }
  async ubahDpia(fasyankesId: number, id: number, m: DpiaMasukan, sekarang: Date): Promise<boolean> {
    const { tandai_ditinjau, tinjau_ulang_pada, ...isi } = m;
    return (await prisma.dpia.updateMany({ where: { id, fasyankes_id: fasyankesId }, data: { ...isi, tinjau_ulang_pada: new Date(`${tinjau_ulang_pada}T00:00:00.000Z`), ...(tandai_ditinjau ? { ditinjau_pada: sekarang } : {}), diperbarui_pada: sekarang } })).count === 1;
  }

  // ---- Insiden ----
  async daftarInsiden(fasyankesId: number, halaman: number, ukuran: number) {
    const where = { fasyankes_id: fasyankesId };
    const [total, baris] = await Promise.all([prisma.insidenData.count({ where }), prisma.insidenData.findMany({ where, orderBy: { waktu_diketahui: 'desc' }, skip: (halaman - 1) * ukuran, take: ukuran })]);
    const pasien = await prisma.insidenPasien.findMany({ where: { fasyankes_id: fasyankesId, insiden_id: { in: baris.map((b) => b.id) } } });
    return { total, baris, pasien };
  }
  async insiden(fasyankesId: number, id: number) {
    return prisma.insidenData.findFirst({ where: { id, fasyankes_id: fasyankesId } });
  }
  async pasienInsiden(fasyankesId: number, insidenId: number): Promise<number[]> {
    return (await prisma.insidenPasien.findMany({ where: { fasyankes_id: fasyankesId, insiden_id: insidenId } })).map((p) => p.pasien_id);
  }
  private dataInsiden(m: InsidenMasukan, waktu: (s: string) => Date) {
    return {
      waktu_kejadian: m.waktu_kejadian ? waktu(m.waktu_kejadian) : null, waktu_diketahui: waktu(m.waktu_diketahui), siber: m.siber, uraian: m.uraian, data_terungkap: m.data_terungkap, penanganan: m.penanganan, pemulihan: m.pemulihan, kontak_ppdp: m.kontak_ppdp,
      notifikasi_pasien_pada: m.notifikasi_pasien_pada ? waktu(m.notifikasi_pasien_pada) : null, notifikasi_lembaga_pada: m.notifikasi_lembaga_pada ? waktu(m.notifikasi_lembaga_pada) : null,
    };
  }
  async buatInsiden(fasyankesId: number, m: InsidenMasukan, oleh: number, waktu: (s: string) => Date): Promise<number> {
    const d = this.dataInsiden(m, waktu);
    return prisma.$transaction(async (tx) => {
      const i = await tx.insidenData.create({ data: { fasyankes_id: fasyankesId, ...d, batas_notifikasi: batasPdp(d.waktu_diketahui), dibuat_oleh: oleh } });
      if (m.pasien_ids.length) await tx.insidenPasien.createMany({ data: [...new Set(m.pasien_ids)].map((pasien_id) => ({ fasyankes_id: fasyankesId, insiden_id: i.id, pasien_id })) });
      return i.id;
    });
  }
  async ubahInsiden(fasyankesId: number, id: number, m: InsidenMasukan, waktu: (s: string) => Date, sekarang: Date): Promise<boolean> {
    const d = this.dataInsiden(m, waktu);
    return prisma.$transaction(async (tx) => {
      const n = await tx.insidenData.updateMany({ where: { id, fasyankes_id: fasyankesId }, data: { ...d, batas_notifikasi: batasPdp(d.waktu_diketahui), diperbarui_pada: sekarang } });
      if (n.count !== 1) return false;
      const ada = new Set((await tx.insidenPasien.findMany({ where: { insiden_id: id } })).map((p) => p.pasien_id));
      const baru = new Set(m.pasien_ids);
      const tambah = [...baru].filter((x) => !ada.has(x));
      if (tambah.length) await tx.insidenPasien.createMany({ data: tambah.map((pasien_id) => ({ fasyankes_id: fasyankesId, insiden_id: id, pasien_id })) });
      // Daftar pasien terdampak hanya bertambah (jejak insiden tidak dihapus).
      return true;
    });
  }

  // ---- Retensi dan pemusnahan ----
  /** Kebijakan retensi; bila belum ada, dibuat kebijakan rekam medis 25 tahun (PMK 24/2022 P39). */
  async kebijakan(fasyankesId: number) {
    if ((await prisma.kebijakanRetensi.count({ where: { fasyankes_id: fasyankesId } })) === 0) {
      await prisma.kebijakanRetensi.create({
        data: { fasyankes_id: fasyankesId, jenis_data: 'Rekam medis elektronik', periode_tahun: 25, dasar_hukum: 'PMK 24/2022 Pasal 39', metode_musnah: 'Penghapusan aman pada sistem, cadangan, dan prosesor dengan berita acara' },
      });
    }
    return prisma.kebijakanRetensi.findMany({ where: { fasyankes_id: fasyankesId }, orderBy: { id: 'asc' } });
  }
  async daftarMusnah(fasyankesId: number, halaman: number, ukuran: number) {
    const where = { fasyankes_id: fasyankesId };
    const [total, baris] = await Promise.all([prisma.pemusnahan.count({ where }), prisma.pemusnahan.findMany({ where, orderBy: { id: 'desc' }, skip: (halaman - 1) * ukuran, take: ukuran })]);
    return { total, baris };
  }
  async musnah(fasyankesId: number, id: number) {
    return prisma.pemusnahan.findFirst({ where: { id, fasyankes_id: fasyankesId } });
  }
  async hakAda(fasyankesId: number, id: number): Promise<boolean> {
    return (await prisma.permintaanHak.count({ where: { id, fasyankes_id: fasyankesId } })) > 0;
  }
  async buatMusnah(fasyankesId: number, m: PemusnahanMasukan, oleh: number): Promise<number> {
    return (await prisma.pemusnahan.create({ data: { fasyankes_id: fasyankesId, cakupan: m.cakupan, dasar: m.dasar, permintaan_hak_id: m.permintaan_hak_id, pasien_id: m.pasien_id, jadwal: new Date(`${m.jadwal}T00:00:00.000Z`), dibuat_oleh: oleh } })).id;
  }
  async majuMusnah(fasyankesId: number, id: number, dari: StatusMusnah, ke: StatusMusnah, data: Prisma.PemusnahanUpdateManyMutationInput & { prosesor_id?: number }): Promise<void> {
    const n = await prisma.pemusnahan.updateMany({ where: { id, fasyankes_id: fasyankesId, status: dari }, data: { ...data, status: ke } });
    if (n.count !== 1) throw new GalatPdp('bentrok');
  }

  // ---- Prosesor ----
  async daftarProsesor(fasyankesId: number, halaman: number, ukuran: number) {
    const where = { fasyankes_id: fasyankesId };
    const [total, baris] = await Promise.all([prisma.prosesorData.count({ where }), prisma.prosesorData.findMany({ where, orderBy: [{ aktif: 'desc' }, { nama: 'asc' }], skip: (halaman - 1) * ukuran, take: ukuran })]);
    return { total, baris };
  }
  async prosesor(fasyankesId: number, id: number) {
    return prisma.prosesorData.findFirst({ where: { id, fasyankes_id: fasyankesId } });
  }
  async prosesorAktif(fasyankesId: number): Promise<{ id: number; nama: string }[]> {
    return prisma.prosesorData.findMany({ where: { fasyankes_id: fasyankesId, aktif: true }, select: { id: true, nama: true }, orderBy: { nama: 'asc' } });
  }
  async namaProsesor(fasyankesId: number, ids: number[]): Promise<Map<number, string>> {
    return new Map((await prisma.prosesorData.findMany({ where: { fasyankes_id: fasyankesId, id: { in: ids } }, select: { id: true, nama: true } })).map((p) => [p.id, p.nama]));
  }
  async buatProsesor(fasyankesId: number, m: ProsesorMasukan, oleh: number): Promise<number> {
    return (await prisma.prosesorData.create({ data: { fasyankes_id: fasyankesId, ...dataProsesor(m), dibuat_oleh: oleh } })).id;
  }
  async ubahProsesor(fasyankesId: number, id: number, m: ProsesorMasukan): Promise<boolean> {
    return (await prisma.prosesorData.updateMany({ where: { id, fasyankes_id: fasyankesId }, data: { ...dataProsesor(m), diperbarui_pada: new Date() } })).count === 1;
  }
}

const dataProsesor = (m: ProsesorMasukan) => ({
  nama: m.nama, layanan: m.layanan, lokasi_data: m.lokasi_data, nomor_perjanjian: m.nomor_perjanjian, butir_perjanjian: m.butir_perjanjian as Prisma.InputJsonValue, sub_prosesor: m.sub_prosesor as unknown as Prisma.InputJsonValue,
  sla_lapor_jam: m.sla_lapor_jam, aktif: m.aktif,
});
