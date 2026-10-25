import { prisma } from '@klira/db';
import type { Prisma } from '@klira/db';
import { hargaTarif, TAHAP_BERJALAN } from '@klira/shared';
import type {
  AdmisiMasukan, AsalAdmisiDto, BedDto, CatatanHarianMasukan, HasilAdmisiDto, KelasRawat, MenungguRuanganDto, OpsiRawatInapDto, PapanDto, PemulanganDto, PemulanganMasukan, PenempatanDto, PenempatanMasukan, RawatInapDto,
} from '@klira/shared';
import { tambahItemTagihanDalam } from '../kasir/repositori';
import { statusDariDb } from '../kunjungan/pemetaan';
import { tulisPengesahanDalam } from '../rekam-medis/repositori';
import type { TulisPengesahan } from '../rekam-medis/repositori';

/** Penolakan aturan alur yang terdeteksi di dalam transaksi (aman dari permintaan serempak); dipetakan ke pesan oleh layanan. */
export type KodeGalatRi = 'sudah_inap' | 'ada_pembayaran' | 'bed_tidak_sah' | 'bed_terisi' | 'bukan_inap' | 'sudah_pulang' | 'tidak_terisi' | 'tidak_ditemukan' | 'alasan_pindah' | 'tarif_tidak_sah';
export class GalatRi extends Error {
  constructor(public readonly kode: KodeGalatRi) {
    super(kode);
  }
}

const tahapBerjalan = [...TAHAP_BERJALAN];
const kunci = (tx: Prisma.TransactionClient, tabel: 'pasien' | 'lokasi' | 'kunjungan', fasyankesId: number, id: number) =>
  tx.$queryRawUnsafe(`SELECT id FROM ${tabel} WHERE id = ? AND fasyankes_id = ? FOR UPDATE`, id, fasyankesId);

export type PelakuRi = { fasyankesId: number; oleh: number };
export type KunjunganRi = { id: number; pasien_id: number; jenis: 'AMB' | 'IMP'; tahap_layanan: string; cara_pembayaran: 'umum' | 'jkn' };

/** Akses data Rawat inap: papan bed, admisi, penempatan, DPJP, catatan harian (CPPT), pemulangan. Hanya INSERT dan penutupan periode; tidak ada hapus. */
export class RepositoriRawatInapPrisma {
  async pasienAda(fasyankesId: number, id: number): Promise<boolean> {
    return (await prisma.pasien.count({ where: { id, fasyankes_id: fasyankesId } })) > 0;
  }

  async dpjpSah(fasyankesId: number, ids: number[]): Promise<boolean> {
    const n = await prisma.pengguna.count({ where: { id: { in: ids }, fasyankes_id: fasyankesId, aktif: true, profil_profesi: { some: { aktif: true } } } });
    return n === new Set(ids).size;
  }

  async tarifKamarSah(fasyankesId: number, id: number): Promise<boolean> {
    return (await prisma.tarifLayanan.count({ where: { id, fasyankes_id: fasyankesId, jenis: 'kamar', aktif: true } })) > 0;
  }

  async kunjungan(fasyankesId: number, id: number): Promise<KunjunganRi | null> {
    const k = await prisma.kunjungan.findFirst({ where: { id, fasyankes_id: fasyankesId }, select: { id: true, pasien_id: true, jenis: true, tahap_layanan: true, cara_pembayaran: true } });
    return k;
  }

  // ---- Opsi dan papan ----
  async opsi(fasyankesId: number): Promise<OpsiRawatInapDto> {
    const [bed, tarif, praktisi] = await Promise.all([
      this.bedSemua(fasyankesId),
      prisma.tarifLayanan.findMany({ where: { fasyankes_id: fasyankesId, jenis: 'kamar', aktif: true }, orderBy: { nama: 'asc' }, take: 200 }),
      prisma.pengguna.findMany({
        where: { fasyankes_id: fasyankesId, aktif: true, profil_profesi: { some: { aktif: true } } }, orderBy: { nama: 'asc' }, take: 500,
        select: { id: true, nama: true, profil_profesi: { where: { aktif: true }, select: { profesi: true }, take: 1 } },
      }),
    ]);
    return {
      bed_kosong: bed.filter((b) => b.status === 'kosong').map((b) => ({ id: b.id, nama: b.nama, ruang_nama: b.ruang_nama })),
      tarif_kamar: tarif.map((t) => ({ id: t.id, kode: t.kode, nama: t.nama, harga_umum: t.harga_umum, harga_jkn: t.harga_jkn })),
      dpjp: praktisi.map((p) => ({ id: p.id, nama: p.nama, profesi: p.profil_profesi[0]?.profesi ?? '' })),
    };
  }

  private async bedSemua(fasyankesId: number): Promise<BedDto[]> {
    const lokasi = await prisma.lokasi.findMany({ where: { fasyankes_id: fasyankesId, jenis: 'bed' }, orderBy: [{ induk_id: 'asc' }, { nama: 'asc' }], take: 1000 });
    const ruang = new Map((await prisma.lokasi.findMany({ where: { fasyankes_id: fasyankesId, id: { in: lokasi.flatMap((l) => (l.induk_id ? [l.induk_id] : [])) } }, select: { id: true, nama: true } })).map((r) => [r.id, r.nama]));
    const aktif = await prisma.penempatan.findMany({ where: { fasyankes_id: fasyankesId, selesai: null } });
    const kunj = await prisma.kunjungan.findMany({ where: { id: { in: aktif.map((a) => a.kunjungan_id) } }, include: { pasien: { select: { nama: true, nomor_rm: true } }, peserta: { where: { tipe: 'ATND', selesai: null }, take: 1 } } });
    const orang = new Map((await prisma.pengguna.findMany({ where: { id: { in: kunj.flatMap((k) => k.peserta.map((p) => p.pengguna_id)) } }, select: { id: true, nama: true } })).map((u) => [u.id, u.nama]));
    return lokasi.map((l): BedDto => {
      const a = aktif.find((x) => x.lokasi_id === l.id);
      const k = a && kunj.find((x) => x.id === a.kunjungan_id);
      return {
        id: l.id, nama: l.nama, ruang_id: l.induk_id, ruang_nama: l.induk_id ? ruang.get(l.induk_id) ?? null : null,
        status: a ? 'terisi' : l.status_operasional === 'O' ? 'kosong' : 'tidak_operasional',
        penghuni: a && k ? { kunjungan_id: k.id, pasien_id: k.pasien_id, pasien_nama: k.pasien.nama, pasien_nomor_rm: k.pasien.nomor_rm, kelas: a.kelas, indikator: a.indikator, mulai: a.mulai.toISOString(), dpjp_nama: k.peserta[0] ? orang.get(k.peserta[0].pengguna_id) ?? null : null } : null,
      };
    });
  }

  async papan(fasyankesId: number): Promise<PapanDto> {
    const bed = await this.bedSemua(fasyankesId);
    const menunggu = await prisma.kunjungan.findMany({
      where: { fasyankes_id: fasyankesId, jenis: 'IMP', status: 'planned', tahap_layanan: { in: tahapBerjalan } }, orderBy: { id: 'asc' }, take: 200,
      include: { pasien: { select: { nama: true, nomor_rm: true } }, peserta: { where: { tipe: 'ATND', selesai: null }, take: 1 } },
    });
    const orang = new Map((await prisma.pengguna.findMany({ where: { id: { in: menunggu.flatMap((k) => k.peserta.map((p) => p.pengguna_id)) } }, select: { id: true, nama: true } })).map((u) => [u.id, u.nama]));
    return {
      bed,
      menunggu: menunggu.map((k): MenungguRuanganDto => ({ kunjungan_id: k.id, pasien_id: k.pasien_id, pasien_nama: k.pasien.nama, pasien_nomor_rm: k.pasien.nomor_rm, mulai: k.mulai.toISOString(), dpjp_nama: k.peserta[0] ? orang.get(k.peserta[0].pengguna_id) ?? null : null })),
      ringkasan: { total: bed.length, terisi: bed.filter((b) => b.status === 'terisi').length, kosong: bed.filter((b) => b.status === 'kosong').length, tidak_operasional: bed.filter((b) => b.status === 'tidak_operasional').length },
    };
  }

  // ---- Asal admisi ----
  async asal(fasyankesId: number, pasienId: number): Promise<AsalAdmisiDto> {
    const berjalan = await prisma.kunjungan.findMany({ where: { fasyankes_id: fasyankesId, pasien_id: pasienId, tahap_layanan: { in: tahapBerjalan } } });
    const imp = berjalan.find((k) => k.jenis === 'IMP');
    const amb = berjalan.find((k) => k.jenis === 'AMB');
    if (!amb) return { asal: null, rawat_inap_id: imp?.id ?? null, ada_pembayaran: false };
    const [poli, tl, bayar] = await Promise.all([
      amb.lokasi_id ? prisma.lokasi.findFirst({ where: { id: amb.lokasi_id }, select: { nama: true } }) : null,
      prisma.tindakLanjut.findFirst({ where: { kunjungan_id: amb.id, jenis: 'rawat_inap' }, orderBy: { versi: 'desc' } }),
      prisma.pembayaran.count({ where: { tagihan: { kunjungan_id: amb.id } } }),
    ]);
    return { asal: { kunjungan_id: amb.id, tahap_layanan: amb.tahap_layanan, poli_nama: poli?.nama ?? null, cara_pembayaran: amb.cara_pembayaran, spri: tl?.spri ?? null }, rawat_inap_id: imp?.id ?? null, ada_pembayaran: bayar > 0 };
  }

  // ---- Admisi ----
  /**
   * Admisi dalam satu transaksi (pasien dikunci): kunjungan rawat inap, DPJP, penempatan, dan bila berasal dari rawat jalan: kunjungan asal ditutup
   * dan tagihan serta resep belum diserahkan dipindah ke rawat inap. Bed dikunci agar tidak terisi dua pasien.
   */
  async admisi(p: PelakuRi, d: AdmisiMasukan, sekarang: Date): Promise<HasilAdmisiDto> {
    return prisma.$transaction(async (tx) => {
      await kunci(tx, 'pasien', p.fasyankesId, d.pasien_id);
      const berjalan = await tx.kunjungan.findMany({ where: { fasyankes_id: p.fasyankesId, pasien_id: d.pasien_id, tahap_layanan: { in: tahapBerjalan } } });
      if (berjalan.some((k) => k.jenis === 'IMP')) throw new GalatRi('sudah_inap');
      const asal = berjalan.find((k) => k.jenis === 'AMB') ?? null;
      if (asal && (await tx.pembayaran.count({ where: { tagihan: { kunjungan_id: asal.id } } })) > 0) throw new GalatRi('ada_pembayaran');
      if (d.bed_id) await this.pastikanBedBebas(tx, p.fasyankesId, d.bed_id);
      const tl = asal && (await tx.tindakLanjut.findFirst({ where: { kunjungan_id: asal.id, jenis: 'rawat_inap' }, orderBy: { versi: 'desc' } }));
      const k = await tx.kunjungan.create({
        data: {
          fasyankes_id: p.fasyankesId, pasien_id: d.pasien_id, jenis: 'IMP', status: d.bed_id ? 'in_progress' : 'planned', tahap_layanan: 'pemeriksaan', kunjungan_asal_id: asal?.id ?? null,
          cara_pembayaran: asal?.cara_pembayaran ?? d.cara_pembayaran, nomor_sep: asal?.nomor_sep ?? null, spri: d.spri ?? tl?.spri ?? null, keluhan_singkat: d.keluhan_singkat ?? asal?.keluhan_singkat ?? null, mulai: sekarang, dibuat_oleh: p.oleh,
        },
      });
      await tx.pesertaKunjungan.create({ data: { fasyankes_id: p.fasyankesId, kunjungan_id: k.id, pengguna_id: d.dpjp_id, tipe: 'ATND', mulai: sekarang, dibuat_oleh: p.oleh } });
      for (const id of d.dpjp_bersama) await tx.pesertaKunjungan.create({ data: { fasyankes_id: p.fasyankesId, kunjungan_id: k.id, pengguna_id: id, tipe: 'SPRF', mulai: sekarang, dibuat_oleh: p.oleh } });
      if (d.bed_id) await this.tempatkan(tx, p, k.id, d.bed_id, d, sekarang);
      if (asal) await this.teruskanDariRawatJalan(tx, p, asal.id, k.id, sekarang);
      return { kunjungan_id: k.id, menunggu_ruangan: !d.bed_id };
    });
  }

  /** Bed harus ada, operasional, dan belum dihuni. Pengecekan hunian memakai pembacaan terkunci (data terbaru), karena salinan data transaksi bisa lebih tua dari kunci bed. */
  private async pastikanBedBebas(tx: Prisma.TransactionClient, fasyankesId: number, bedId: number): Promise<void> {
    await kunci(tx, 'lokasi', fasyankesId, bedId);
    const bed = await tx.lokasi.findFirst({ where: { id: bedId, fasyankes_id: fasyankesId, jenis: 'bed' } });
    if (!bed) throw new GalatRi('bed_tidak_sah');
    const dihuni = (await tx.$queryRawUnsafe<unknown[]>('SELECT id FROM penempatan WHERE fasyankes_id = ? AND lokasi_id = ? AND selesai IS NULL FOR UPDATE', fasyankesId, bedId)).length > 0;
    if (dihuni) throw new GalatRi('bed_terisi');
    if (bed.status_operasional !== 'O') throw new GalatRi('bed_tidak_sah');
  }

  private async tempatkan(tx: Prisma.TransactionClient, p: PelakuRi, kunjunganId: number, bedId: number, d: { kelas: KelasRawat; indikator: 'kelas_tetap' | 'naik_kelas' | 'turun_kelas' | 'titip_rawat'; tarif_id?: number | null }, sekarang: Date): Promise<void> {
    if (d.tarif_id && !(await tx.tarifLayanan.count({ where: { id: d.tarif_id, fasyankes_id: p.fasyankesId, jenis: 'kamar', aktif: true } }))) throw new GalatRi('tarif_tidak_sah');
    await tx.penempatan.create({ data: { fasyankes_id: p.fasyankesId, kunjungan_id: kunjunganId, lokasi_id: bedId, kelas: d.kelas, indikator: d.indikator, tarif_id: d.tarif_id ?? null, mulai: sekarang, dibuat_oleh: p.oleh } });
    await tx.lokasi.update({ where: { id: bedId }, data: { status_operasional: 'U' } });
  }

  private async teruskanDariRawatJalan(tx: Prisma.TransactionClient, p: PelakuRi, asalId: number, baruId: number, sekarang: Date): Promise<void> {
    const lama = await tx.tagihan.findUnique({ where: { kunjungan_id: asalId } });
    if (lama) {
      const baru = await tx.tagihan.upsert({ where: { kunjungan_id: baruId }, update: {}, create: { fasyankes_id: p.fasyankesId, kunjungan_id: baruId, dibuat_oleh: p.oleh } });
      await tx.itemTagihan.updateMany({ where: { tagihan_id: lama.id }, data: { tagihan_id: baru.id } });
      const semua = await tx.itemTagihan.findMany({ where: { tagihan_id: baru.id }, select: { harga: true } });
      await tx.tagihan.update({ where: { id: baru.id }, data: { status_tagihan: semua.every((x) => x.harga !== null) ? 'lengkap' : 'belum_lengkap' } });
    }
    await tx.resep.updateMany({ where: { kunjungan_id: asalId, fasyankes_id: p.fasyankesId, status: { not: 'diserahkan' } }, data: { kunjungan_id: baruId } });
    const antrean = await tx.antrean.findUnique({ where: { kunjungan_id: asalId } });
    if (antrean && antrean.status !== 'selesai' && antrean.status !== 'batal') {
      await tx.antrean.update({ where: { id: antrean.id }, data: antrean.status === 'dilayani' ? { status: 'selesai', waktu_selesai: sekarang } : { status: 'batal' } });
    }
    await tx.kunjungan.update({ where: { id: asalId }, data: { tahap_layanan: 'ditutup', status: 'finished', selesai: sekarang, waktu_tutup: sekarang } });
  }

  // ---- Detail dan penempatan ----
  async detail(fasyankesId: number, kunjunganId: number): Promise<RawatInapDto | null> {
    const k = await prisma.kunjungan.findFirst({ where: { id: kunjunganId, fasyankes_id: fasyankesId, jenis: 'IMP' }, include: { pasien: { select: { nama: true, nomor_rm: true } } } });
    if (!k) return null;
    const [pen, peserta, pulang] = await Promise.all([
      prisma.penempatan.findMany({ where: { kunjungan_id: k.id }, orderBy: { id: 'asc' } }),
      prisma.pesertaKunjungan.findMany({ where: { kunjungan_id: k.id, selesai: null }, orderBy: { id: 'asc' } }),
      prisma.pemulangan.findUnique({ where: { kunjungan_id: k.id } }),
    ]);
    const bed = new Map((await prisma.lokasi.findMany({ where: { id: { in: pen.map((x) => x.lokasi_id) } }, select: { id: true, nama: true, induk_id: true } })).map((l) => [l.id, l]));
    const ruang = new Map((await prisma.lokasi.findMany({ where: { id: { in: [...bed.values()].flatMap((b) => (b.induk_id ? [b.induk_id] : [])) } }, select: { id: true, nama: true } })).map((l) => [l.id, l.nama]));
    const tarif = new Map((await prisma.tarifLayanan.findMany({ where: { id: { in: pen.flatMap((x) => (x.tarif_id ? [x.tarif_id] : [])) } }, select: { id: true, nama: true } })).map((t) => [t.id, t.nama]));
    const orang = new Map((await prisma.pengguna.findMany({ where: { id: { in: [...peserta.map((x) => x.pengguna_id), ...(pulang ? [pulang.dibuat_oleh] : [])] } }, select: { id: true, nama: true } })).map((u) => [u.id, u.nama]));
    return {
      kunjungan: { id: k.id, pasien_id: k.pasien_id, pasien_nama: k.pasien.nama, pasien_nomor_rm: k.pasien.nomor_rm, status: statusDariDb(k.status), tahap_layanan: k.tahap_layanan, cara_pembayaran: k.cara_pembayaran, mulai: k.mulai.toISOString(), spri: k.spri },
      penempatan: pen.map((x): PenempatanDto => ({
        id: x.id, bed_id: x.lokasi_id, bed_nama: bed.get(x.lokasi_id)?.nama ?? null, ruang_nama: ruang.get(bed.get(x.lokasi_id)?.induk_id ?? 0) ?? null, kelas: x.kelas, indikator: x.indikator,
        tarif_id: x.tarif_id, tarif_nama: x.tarif_id ? tarif.get(x.tarif_id) ?? null : null, mulai: x.mulai.toISOString(), selesai: x.selesai?.toISOString() ?? null,
      })),
      dpjp: peserta.map((x) => ({ id: x.pengguna_id, nama: orang.get(x.pengguna_id) ?? '-', tipe: x.tipe })),
      pemulangan: pulang && ({ disposisi: pulang.disposisi, kondisi_pulang: pulang.kondisi_pulang, diagnosis_akhir: pulang.diagnosis_akhir, ringkasan: pulang.ringkasan, tindak_lanjut: pulang.tindak_lanjut, waktu: pulang.waktu.toISOString(), dibuat_oleh_nama: orang.get(pulang.dibuat_oleh) ?? null } satisfies PemulanganDto),
    };
  }

  /** Pindah bed/kelas (menutup periode lama, membuka yang baru) dan/atau ganti DPJP; kunjungan dikunci agar perubahan serempak berurutan. */
  async ubahPenempatan(p: PelakuRi, kunjunganId: number, d: PenempatanMasukan, sekarang: Date): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await kunci(tx, 'kunjungan', p.fasyankesId, kunjunganId);
      const k = await tx.kunjungan.findFirst({ where: { id: kunjunganId, fasyankes_id: p.fasyankesId } });
      if (!k) throw new GalatRi('tidak_ditemukan');
      if (k.jenis !== 'IMP') throw new GalatRi('bukan_inap');
      if (k.tahap_layanan === 'kasir' || k.tahap_layanan === 'ditutup') throw new GalatRi('sudah_pulang');
      const sekarangAktif = await tx.penempatan.findFirst({ where: { kunjungan_id: kunjunganId, selesai: null } });
      const bedTujuan = d.bed_id ?? sekarangAktif?.lokasi_id ?? null;
      if (bedTujuan) {
        const sama = sekarangAktif && sekarangAktif.lokasi_id === bedTujuan;
        const kelasSama = sama && sekarangAktif.kelas === d.kelas && sekarangAktif.indikator === d.indikator && (sekarangAktif.tarif_id ?? null) === (d.tarif_id ?? null);
        if (!kelasSama) {
          if (sekarangAktif && !d.alasan?.trim()) throw new GalatRi('alasan_pindah');
          if (!sama) await this.pastikanBedBebas(tx, p.fasyankesId, bedTujuan);
          if (sekarangAktif) {
            await tx.penempatan.update({ where: { id: sekarangAktif.id }, data: { selesai: sekarang } });
            if (!sama) await tx.lokasi.update({ where: { id: sekarangAktif.lokasi_id }, data: { status_operasional: 'O' } });
          }
          if (sama) {
            await tx.penempatan.create({ data: { fasyankes_id: p.fasyankesId, kunjungan_id: kunjunganId, lokasi_id: bedTujuan, kelas: d.kelas, indikator: d.indikator, tarif_id: d.tarif_id ?? null, mulai: sekarang, dibuat_oleh: p.oleh } });
          } else {
            await this.tempatkan(tx, p, kunjunganId, bedTujuan, d, sekarang);
          }
          if (k.status === 'planned') await tx.kunjungan.update({ where: { id: kunjunganId }, data: { status: 'in_progress' } });
        }
      }
      await this.terapkanDpjp(tx, p, kunjunganId, d.dpjp_id, d.dpjp_bersama, sekarang);
    });
  }

  private async terapkanDpjp(tx: Prisma.TransactionClient, p: PelakuRi, kunjunganId: number, utama: number, bersama: number[], sekarang: Date): Promise<void> {
    const aktif = await tx.pesertaKunjungan.findMany({ where: { kunjungan_id: kunjunganId, selesai: null } });
    const inginkan: { id: number; tipe: 'ATND' | 'SPRF' }[] = [{ id: utama, tipe: 'ATND' }, ...bersama.map((id) => ({ id, tipe: 'SPRF' as const }))];
    for (const a of aktif) {
      if (!inginkan.some((x) => x.id === a.pengguna_id && x.tipe === a.tipe)) await tx.pesertaKunjungan.update({ where: { id: a.id }, data: { selesai: sekarang } });
    }
    for (const x of inginkan) {
      if (!aktif.some((a) => a.pengguna_id === x.id && a.tipe === x.tipe)) {
        await tx.pesertaKunjungan.create({ data: { fasyankes_id: p.fasyankesId, kunjungan_id: kunjunganId, pengguna_id: x.id, tipe: x.tipe, mulai: sekarang, dibuat_oleh: p.oleh } });
      }
    }
  }

  // ---- Catatan harian (CPPT) ----
  async daftarCatatan(fasyankesId: number, kunjunganId: number): Promise<{ id: number; isi: CatatanHarianMasukan; dibuat_oleh: number; dibuat_pada: Date }[]> {
    const baris = await prisma.catatanHarian.findMany({ where: { fasyankes_id: fasyankesId, kunjungan_id: kunjunganId }, orderBy: { id: 'desc' }, take: 200 });
    return baris.map((b) => ({ id: b.id, isi: isiCatatan(b), dibuat_oleh: b.dibuat_oleh, dibuat_pada: b.dibuat_pada }));
  }

  async isiCatatan(fasyankesId: number, id: number): Promise<CatatanHarianMasukan | null> {
    const b = await prisma.catatanHarian.findFirst({ where: { id, fasyankes_id: fasyankesId } });
    return b && isiCatatan(b);
  }

  async namaPengguna(ids: number[]): Promise<Map<number, string>> {
    return new Map((await prisma.pengguna.findMany({ where: { id: { in: [...new Set(ids)] } }, select: { id: true, nama: true } })).map((u) => [u.id, u.nama]));
  }

  async tambahCatatan(fasyankesId: number, kunjunganId: number, isi: CatatanHarianMasukan, oleh: number, pengesahan: (id: number) => Omit<TulisPengesahan, 'fasyankesId' | 'entitas' | 'entitasId'>): Promise<number> {
    return prisma.$transaction(async (tx) => {
      const b = await tx.catatanHarian.create({
        data: {
          fasyankes_id: fasyankesId, kunjungan_id: kunjunganId, subjektif: isi.subjektif, objektif: isi.objektif, asesmen: isi.asesmen, rencana: isi.rencana, instruksi: isi.instruksi,
          tanda_vital: isi.tanda_vital ? (isi.tanda_vital as Prisma.InputJsonValue) : undefined, dibuat_oleh: oleh,
        },
      });
      await tulisPengesahanDalam(tx, { ...pengesahan(b.id), fasyankesId, entitas: 'cppt', entitasId: b.id });
      return b.id;
    });
  }

  // ---- Pemulangan ----
  /** Pemulangan atomik: catat pemulangan, tutup penempatan dan periode DPJP, kosongkan bed, tambah biaya kamar, lanjutkan kunjungan ke kasir. */
  async pulangkan(p: PelakuRi, kunjunganId: number, d: PemulanganMasukan, sekarang: Date): Promise<{ pemulangan: Date; tagihanKamar: number }> {
    return prisma.$transaction(async (tx) => {
      await kunci(tx, 'kunjungan', p.fasyankesId, kunjunganId);
      const k = await tx.kunjungan.findFirst({ where: { id: kunjunganId, fasyankes_id: p.fasyankesId } });
      if (!k) throw new GalatRi('tidak_ditemukan');
      if (k.jenis !== 'IMP') throw new GalatRi('bukan_inap');
      if (k.tahap_layanan === 'kasir' || k.tahap_layanan === 'ditutup' || (await tx.pemulangan.count({ where: { kunjungan_id: kunjunganId } })) > 0) throw new GalatRi('sudah_pulang');
      await tx.pemulangan.create({
        data: {
          fasyankes_id: p.fasyankesId, kunjungan_id: kunjunganId, disposisi: d.disposisi, kondisi_pulang: d.kondisi_pulang, diagnosis_akhir: d.diagnosis_akhir, ringkasan: d.ringkasan, tindak_lanjut: d.tindak_lanjut, waktu: sekarang, dibuat_oleh: p.oleh,
        },
      });
      const aktif = await tx.penempatan.findMany({ where: { kunjungan_id: kunjunganId, selesai: null } });
      for (const a of aktif) {
        await tx.penempatan.update({ where: { id: a.id }, data: { selesai: sekarang } });
        await tx.lokasi.update({ where: { id: a.lokasi_id }, data: { status_operasional: 'O' } });
      }
      await tx.pesertaKunjungan.updateMany({ where: { kunjungan_id: kunjunganId, selesai: null }, data: { selesai: sekarang } });
      const semua = await tx.penempatan.findMany({ where: { kunjungan_id: kunjunganId, tarif_id: { not: null } } });
      const tarif = new Map((await tx.tarifLayanan.findMany({ where: { id: { in: semua.flatMap((x) => (x.tarif_id ? [x.tarif_id] : [])) } } })).map((t) => [t.id, t]));
      const item = semua.map((x) => {
        const t = tarif.get(x.tarif_id!)!;
        const hari = Math.max(1, Math.ceil(((x.selesai ?? sekarang).getTime() - x.mulai.getTime()) / 86_400_000));
        return { jenis: 'kamar' as const, tarifId: t.id, kode: t.kode, nama: `${t.nama} (${hari} hari)`, harga: hargaTarif(t, k.cara_pembayaran), orderPenunjangId: null, jumlah: hari };
      });
      if (item.length) await tambahItemTagihanDalam(tx, p.fasyankesId, kunjunganId, p.oleh, item);
      await tx.kunjungan.update({ where: { id: kunjunganId }, data: { tahap_layanan: 'kasir', status: 'finished', selesai: sekarang } });
      return { pemulangan: sekarang, tagihanKamar: item.length };
    });
  }
}

function isiCatatan(b: { subjektif: string; objektif: string; asesmen: string; rencana: string; instruksi: string | null; tanda_vital: unknown }): CatatanHarianMasukan {
  return { subjektif: b.subjektif, objektif: b.objektif, asesmen: b.asesmen, rencana: b.rencana, instruksi: b.instruksi, tanda_vital: (b.tanda_vital as CatatanHarianMasukan['tanda_vital']) ?? null };
}
