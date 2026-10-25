import { prisma, Prisma } from '@klira/db';
import { BAGIAN_KLINIS, hargaTarif, rentangHariWib, teksRujukan } from '@klira/shared';
import type {
  FilterMasterPemeriksaan, FilterRekapLab, InterpretasiHasil, MasterPemeriksaanDto, MasterPemeriksaanMasukan, PrioritasOrder, RekapLabDto, StatusOrderPenunjang, StatusPembayaran, StatusTagihan,
  TarifLabDto, UbahMasterPemeriksaanMasukan,
} from '@klira/shared';
import { tambahItemTagihanDalam, totalTagihan } from '../kasir/repositori';
import { tulisAddendumDalam } from '../rekam-medis/repositori-addendum';
import { tulisPengesahanDalam } from '../rekam-medis/repositori';
import type { TulisPengesahan } from '../rekam-medis/repositori';
import { susunIsiHasil } from './isi';

export type KunjunganOrder = { id: number; pasien_id: number; tahap_layanan: string; cara_pembayaran: 'umum' | 'jkn' };
export type MasterBaris = MasterPemeriksaanDto & { tarif_layanan_id: number | null };
export type OrderBaris = {
  id: number; kunjungan_id: number; pasien_id: number; nama: string; kode_loinc: string | null; prioritas: PrioritasOrder; catatan: string | null; status: StatusOrderPenunjang;
  dibuat_pada: Date; dibuat_oleh_nama: string | null;
  master: { satuan: string | null; rujukan_teks: string | null; rujukan_min: number | null; rujukan_maks: number | null; jenis_spesimen: string | null } | null;
  spesimen: { asal: string; waktu_ambil: Date; petugas_id: number; petugas_nama: string } | null;
  hasil: {
    nilai: string; satuan: string | null; rujukan_teks: string | null; interpretasi: InterpretasiHasil; catatan: string | null; dientri_oleh: string; dientri_pada: Date;
    validator_nama: string | null; divalidasi_pada: Date | null;
  } | null;
};
export type RingkasTagihan = { status_tagihan: StatusTagihan; status_pembayaran: StatusPembayaran; total: number };

/** Penulisan serempak berebut status atau versi yang sama: pemanggil diminta memuat ulang. */
export class BentrokError extends Error {
  constructor() {
    super('bentrok penunjang');
  }
}

export interface RepositoriPenunjang {
  kunjungan(fasyankesId: number, id: number): Promise<KunjunganOrder | null>;
  /** Bagian catatan klinis kunjungan yang sudah punya pengesahan. */
  bagianDisahkan(fasyankesId: number, kunjunganId: number): Promise<string[]>;
  masterAktifDari(fasyankesId: number, ids: readonly number[]): Promise<MasterBaris[]>;
  buatOrder(d: { fasyankesId: number; kunjungan: KunjunganOrder; oleh: number; master: readonly MasterBaris[]; prioritas: PrioritasOrder; catatan: string | null }): Promise<{ orderIds: number[]; tagihan: RingkasTagihan }>;
  order(fasyankesId: number, id: number): Promise<OrderBaris | null>;
  ordersKunjungan(fasyankesId: number, kunjunganId: number): Promise<OrderBaris[]>;
  penggunaAda(fasyankesId: number, id: number): Promise<boolean>;
  /** Spesimen dicatat dan status maju hanya bila order masih `dipesan`; false bila sudah berubah. */
  catatSpesimen(d: { fasyankesId: number; orderId: number; asal: string; waktuAmbil: Date; petugasId: number; oleh: number }): Promise<boolean>;
  /** Hasil disimpan (boleh berulang) bila status spesimen_diambil atau menunggu_hasil; false bila status berubah. */
  simpanHasil(d: { fasyankesId: number; orderId: number; nilai: string; satuan: string | null; rujukanTeks: string | null; interpretasi: InterpretasiHasil; catatan: string | null; oleh: number; waktu: Date }): Promise<boolean>;
  /** Validasi, pengesahan, dan (bila catatan sudah disahkan) addendum dalam satu transaksi; false bila status sudah berubah. */
  validasi(d: {
    fasyankesId: number; orderId: number; kunjunganId: number; oleh: number; waktu: Date; pengesahan: Omit<TulisPengesahan, 'fasyankesId' | 'entitas' | 'entitasId'>;
    addendum: { alasan: string } | null;
  }): Promise<boolean>;
  rekap(fasyankesId: number, f: FilterRekapLab): Promise<RekapLabDto>;
  daftarMaster(fasyankesId: number, f: FilterMasterPemeriksaan): Promise<MasterPemeriksaanDto[]>;
  master(fasyankesId: number, id: number): Promise<MasterPemeriksaanDto | null>;
  tarifLab(fasyankesId: number): Promise<TarifLabDto[]>;
  tarifLabSah(fasyankesId: number, id: number): Promise<boolean>;
  /** null bila kode sudah dipakai. */
  buatMaster(fasyankesId: number, oleh: number, d: MasterPemeriksaanMasukan): Promise<MasterPemeriksaanDto | null>;
  ubahMaster(fasyankesId: number, id: number, d: UbahMasterPemeriksaanMasukan): Promise<MasterPemeriksaanDto | null>;
  /** Isi kanonik hasil sekarang untuk deteksi perubahan setelah divalidasi (null bila belum ada hasil). */
  isiHasil(fasyankesId: number, orderId: number): Promise<unknown>;
}

const iso = (d: Date): string => d.toISOString();
const tarifDto = (t: { id: number; kode: string; nama: string; harga_umum: number; harga_jkn: number | null }): TarifLabDto => ({ id: t.id, kode: t.kode, nama: t.nama, harga_umum: t.harga_umum, harga_jkn: t.harga_jkn });

type BarisMasterDb = Prisma.MasterPemeriksaanGetPayload<object>;
async function petakanMaster(fasyankesId: number, baris: BarisMasterDb[]): Promise<MasterBaris[]> {
  const tarifIds = [...new Set(baris.flatMap((b) => (b.tarif_layanan_id ? [b.tarif_layanan_id] : [])))];
  const tarif = tarifIds.length ? await prisma.tarifLayanan.findMany({ where: { id: { in: tarifIds }, fasyankes_id: fasyankesId } }) : [];
  const peta = new Map(tarif.map((t) => [t.id, tarifDto(t)]));
  return baris.map((b) => ({
    id: b.id, kode: b.kode, nama: b.nama, kode_loinc: b.kode_loinc, loinc_contoh: b.loinc_contoh, jenis_spesimen: b.jenis_spesimen, satuan: b.satuan, rujukan_min: b.rujukan_min,
    rujukan_maks: b.rujukan_maks, rujukan_teks: b.rujukan_teks, aktif: b.aktif, tarif: b.tarif_layanan_id ? peta.get(b.tarif_layanan_id) ?? null : null, tarif_layanan_id: b.tarif_layanan_id,
  }));
}
const keMasterDto = (m: MasterBaris): MasterPemeriksaanDto => ({
  id: m.id, kode: m.kode, nama: m.nama, kode_loinc: m.kode_loinc, loinc_contoh: m.loinc_contoh, jenis_spesimen: m.jenis_spesimen, satuan: m.satuan, rujukan_min: m.rujukan_min,
  rujukan_maks: m.rujukan_maks, rujukan_teks: m.rujukan_teks, aktif: m.aktif, tarif: m.tarif,
});

export class RepositoriPenunjangPrisma implements RepositoriPenunjang {
  async kunjungan(fasyankesId: number, id: number): Promise<KunjunganOrder | null> {
    return prisma.kunjungan.findFirst({ where: { id, fasyankes_id: fasyankesId }, select: { id: true, pasien_id: true, tahap_layanan: true, cara_pembayaran: true } });
  }

  async bagianDisahkan(fasyankesId: number, kunjunganId: number): Promise<string[]> {
    const p = await prisma.pengesahanCatatan.findMany({
      where: { fasyankes_id: fasyankesId, entitas_id: kunjunganId, entitas: { in: [...BAGIAN_KLINIS] } }, distinct: ['entitas'], select: { entitas: true },
    });
    return p.map((x) => x.entitas);
  }

  async masterAktifDari(fasyankesId: number, ids: readonly number[]): Promise<MasterBaris[]> {
    return petakanMaster(fasyankesId, await prisma.masterPemeriksaan.findMany({ where: { fasyankes_id: fasyankesId, aktif: true, jenis: 'lab', id: { in: [...ids] } } }));
  }

  async buatOrder(d: Parameters<RepositoriPenunjang['buatOrder']>[0]) {
    const tarif = await prisma.tarifLayanan.findMany({ where: { fasyankes_id: d.fasyankesId, aktif: true, jenis: 'lab', id: { in: d.master.flatMap((m) => (m.tarif_layanan_id ? [m.tarif_layanan_id] : [])) } } });
    const tarifPer = new Map(tarif.map((t) => [t.id, t]));
    return prisma.$transaction(async (tx) => {
      const item = [];
      const orderIds: number[] = [];
      for (const m of d.master) {
        const o = await tx.orderPenunjang.create({
          data: {
            fasyankes_id: d.fasyankesId, kunjungan_id: d.kunjungan.id, pasien_id: d.kunjungan.pasien_id, jenis: 'lab', master_pemeriksaan_id: m.id, kode_loinc: m.kode_loinc, nama: m.nama,
            prioritas: d.prioritas, catatan: d.catatan, dibuat_oleh: d.oleh,
          },
        });
        orderIds.push(o.id);
        const t = m.tarif_layanan_id ? tarifPer.get(m.tarif_layanan_id) ?? null : null;
        item.push({ jenis: 'lab' as const, tarifId: t?.id ?? null, kode: t?.kode ?? m.kode, nama: m.nama, harga: hargaTarif(t, d.kunjungan.cara_pembayaran), orderPenunjangId: o.id });
      }
      const tagihanId = await tambahItemTagihanDalam(tx, d.fasyankesId, d.kunjungan.id, d.oleh, item);
      const t = await tx.tagihan.findUniqueOrThrow({ where: { id: tagihanId }, include: { item: { select: { harga: true, jumlah: true } } } });
      return { orderIds, tagihan: { status_tagihan: t.status_tagihan, status_pembayaran: t.status_pembayaran, total: totalTagihan(t.item) } };
    });
  }

  private async petakanOrder(fasyankesId: number, baris: Prisma.OrderPenunjangGetPayload<{ include: { master: true; spesimen: true; hasil: true } }>[]): Promise<OrderBaris[]> {
    const ids = new Set<number>();
    for (const b of baris) {
      if (b.dibuat_oleh) ids.add(b.dibuat_oleh);
      if (b.spesimen) ids.add(b.spesimen.petugas_id);
      if (b.hasil) {
        ids.add(b.hasil.dientri_oleh);
        if (b.hasil.validator_id) ids.add(b.hasil.validator_id);
      }
    }
    const pengguna = ids.size ? await prisma.pengguna.findMany({ where: { id: { in: [...ids] }, fasyankes_id: fasyankesId }, select: { id: true, nama: true } }) : [];
    const nama = new Map(pengguna.map((p) => [p.id, p.nama]));
    return baris.map((b) => ({
      id: b.id, kunjungan_id: b.kunjungan_id, pasien_id: b.pasien_id, nama: b.nama, kode_loinc: b.kode_loinc, prioritas: b.prioritas as PrioritasOrder, catatan: b.catatan, status: b.status,
      dibuat_pada: b.dibuat_pada, dibuat_oleh_nama: b.dibuat_oleh ? nama.get(b.dibuat_oleh) ?? null : null,
      master: b.master && {
        satuan: b.master.satuan, rujukan_teks: teksRujukan(b.master), rujukan_min: b.master.rujukan_min, rujukan_maks: b.master.rujukan_maks, jenis_spesimen: b.master.jenis_spesimen,
      },
      spesimen: b.spesimen && { asal: b.spesimen.asal, waktu_ambil: b.spesimen.waktu_ambil, petugas_id: b.spesimen.petugas_id, petugas_nama: nama.get(b.spesimen.petugas_id) ?? '-' },
      hasil: b.hasil && {
        nilai: b.hasil.nilai, satuan: b.hasil.satuan, rujukan_teks: b.hasil.rujukan_teks, interpretasi: b.hasil.interpretasi as InterpretasiHasil, catatan: b.hasil.catatan,
        dientri_oleh: nama.get(b.hasil.dientri_oleh) ?? '-', dientri_pada: b.hasil.dientri_pada, validator_nama: b.hasil.validator_id ? nama.get(b.hasil.validator_id) ?? null : null,
        divalidasi_pada: b.hasil.divalidasi_pada,
      },
    }));
  }

  async order(fasyankesId: number, id: number): Promise<OrderBaris | null> {
    const o = await prisma.orderPenunjang.findFirst({ where: { id, fasyankes_id: fasyankesId }, include: { master: true, spesimen: true, hasil: true } });
    return o ? (await this.petakanOrder(fasyankesId, [o]))[0] : null;
  }

  async ordersKunjungan(fasyankesId: number, kunjunganId: number): Promise<OrderBaris[]> {
    return this.petakanOrder(
      fasyankesId, await prisma.orderPenunjang.findMany({ where: { fasyankes_id: fasyankesId, kunjungan_id: kunjunganId }, orderBy: { id: 'asc' }, include: { master: true, spesimen: true, hasil: true } }),
    );
  }

  async penggunaAda(fasyankesId: number, id: number): Promise<boolean> {
    return (await prisma.pengguna.count({ where: { id, fasyankes_id: fasyankesId, aktif: true } })) > 0;
  }

  async catatSpesimen(d: Parameters<RepositoriPenunjang['catatSpesimen']>[0]): Promise<boolean> {
    return prisma.$transaction(async (tx) => {
      const u = await tx.orderPenunjang.updateMany({ where: { id: d.orderId, fasyankes_id: d.fasyankesId, status: 'dipesan' }, data: { status: 'spesimen_diambil' } });
      if (u.count === 0) return false;
      await tx.spesimen.create({ data: { fasyankes_id: d.fasyankesId, order_id: d.orderId, asal: d.asal, waktu_ambil: d.waktuAmbil, petugas_id: d.petugasId, dibuat_oleh: d.oleh } });
      return true;
    });
  }

  async simpanHasil(d: Parameters<RepositoriPenunjang['simpanHasil']>[0]): Promise<boolean> {
    return prisma.$transaction(async (tx) => {
      const u = await tx.orderPenunjang.updateMany({ where: { id: d.orderId, fasyankes_id: d.fasyankesId, status: { in: ['spesimen_diambil', 'menunggu_hasil'] } }, data: { status: 'menunggu_hasil' } });
      if (u.count === 0) return false;
      const data = { nilai: d.nilai, satuan: d.satuan, rujukan_teks: d.rujukanTeks, interpretasi: d.interpretasi, catatan: d.catatan, dientri_oleh: d.oleh, dientri_pada: d.waktu };
      await tx.hasilPenunjang.upsert({ where: { order_id: d.orderId }, update: data, create: { fasyankes_id: d.fasyankesId, order_id: d.orderId, ...data } });
      return true;
    });
  }

  async validasi(d: Parameters<RepositoriPenunjang['validasi']>[0]): Promise<boolean> {
    try {
      return await prisma.$transaction(async (tx) => {
        const u = await tx.orderPenunjang.updateMany({ where: { id: d.orderId, fasyankes_id: d.fasyankesId, status: 'menunggu_hasil' }, data: { status: 'divalidasi' } });
        if (u.count === 0) return false;
        const o = await tx.orderPenunjang.findUniqueOrThrow({ where: { id: d.orderId }, include: { hasil: true } });
        const h = o.hasil;
        if (!h) throw new BentrokError();
        await tx.hasilPenunjang.update({ where: { order_id: d.orderId }, data: { validator_id: d.oleh, divalidasi_pada: d.waktu } });
        await tulisPengesahanDalam(tx, { ...d.pengesahan, fasyankesId: d.fasyankesId, entitas: 'hasil_penunjang', entitasId: d.orderId });
        if (d.addendum) {
          await tulisAddendumDalam(tx, {
            fasyankesId: d.fasyankesId, kunjunganId: d.kunjunganId, entitas: 'hasil_penunjang', entitasId: d.orderId, alasan: d.addendum.alasan, oleh: d.oleh,
            jenisAkun: d.pengesahan.jenisAkun, waktu: d.waktu,
            isi: susunIsiHasil({ order_id: o.id, nama: o.nama, kode_loinc: o.kode_loinc, nilai: h.nilai, satuan: h.satuan, rujukan_teks: h.rujukan_teks, interpretasi: h.interpretasi, catatan: h.catatan }),
          });
        }
        return true;
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && (e.code === 'P2002' || e.code === 'P2034')) throw new BentrokError();
      throw e;
    }
  }

  async isiHasil(fasyankesId: number, orderId: number): Promise<unknown> {
    const o = await prisma.orderPenunjang.findFirst({ where: { id: orderId, fasyankes_id: fasyankesId }, include: { hasil: true } });
    if (!o?.hasil) return null;
    const h = o.hasil;
    return susunIsiHasil({ order_id: o.id, nama: o.nama, kode_loinc: o.kode_loinc, nilai: h.nilai, satuan: h.satuan, rujukan_teks: h.rujukan_teks, interpretasi: h.interpretasi, catatan: h.catatan });
  }

  async rekap(fasyankesId: number, f: FilterRekapLab): Promise<RekapLabDto> {
    const { awal, akhir } = rentangHariWib(f.dari, f.sampai);
    const waktu = { ...(awal ? { gte: awal } : {}), ...(akhir ? { lt: akhir } : {}) };
    const dasar: Prisma.OrderPenunjangWhereInput = { fasyankes_id: fasyankesId, ...(awal || akhir ? { dibuat_pada: waktu } : {}) };
    const where = { ...dasar, ...(f.status ? { status: f.status } : {}) };
    const [total, baris, g] = await Promise.all([
      prisma.orderPenunjang.count({ where }),
      prisma.orderPenunjang.findMany({ where, orderBy: [{ id: 'desc' }], skip: (f.halaman - 1) * f.ukuran, take: f.ukuran, include: { hasil: true } }),
      prisma.orderPenunjang.groupBy({ by: ['status'], where: dasar, _count: { _all: true } }),
    ]);
    const pasienIds = [...new Set(baris.map((b) => b.pasien_id))];
    const pasien = pasienIds.length ? await prisma.pasien.findMany({ where: { id: { in: pasienIds }, fasyankes_id: fasyankesId }, select: { id: true, nama: true, nomor_rm: true } }) : [];
    const peta = new Map(pasien.map((p) => [p.id, p]));
    const jumlah: Record<StatusOrderPenunjang, number> = { dipesan: 0, spesimen_diambil: 0, menunggu_hasil: 0, divalidasi: 0 };
    for (const r of g) jumlah[r.status] = r._count._all;
    return {
      data: baris.map((b) => ({
        id: b.id, kunjungan_id: b.kunjungan_id, pasien_nama: peta.get(b.pasien_id)?.nama ?? '-', pasien_nomor_rm: peta.get(b.pasien_id)?.nomor_rm ?? '-', nama: b.nama,
        prioritas: b.prioritas as PrioritasOrder, status: b.status, dibuat_pada: iso(b.dibuat_pada),
        hasil_singkat: b.hasil ? `${b.hasil.nilai}${b.hasil.satuan ? ` ${b.hasil.satuan}` : ''}` : null, interpretasi: b.hasil ? (b.hasil.interpretasi as InterpretasiHasil) : null,
      })),
      halaman: f.halaman, ukuran: f.ukuran, total, jumlah_status: jumlah,
    };
  }

  async daftarMaster(fasyankesId: number, f: FilterMasterPemeriksaan): Promise<MasterPemeriksaanDto[]> {
    const where: Prisma.MasterPemeriksaanWhereInput = {
      fasyankes_id: fasyankesId, jenis: 'lab', ...(f.aktif !== undefined ? { aktif: f.aktif } : {}),
      ...(f.cari ? { OR: [{ nama: { contains: f.cari } }, { kode: { contains: f.cari } }, { kode_loinc: { contains: f.cari } }] } : {}),
    };
    return (await petakanMaster(fasyankesId, await prisma.masterPemeriksaan.findMany({ where, orderBy: [{ nama: 'asc' }, { id: 'asc' }], take: 500 }))).map(keMasterDto);
  }

  async master(fasyankesId: number, id: number): Promise<MasterPemeriksaanDto | null> {
    const m = await prisma.masterPemeriksaan.findFirst({ where: { id, fasyankes_id: fasyankesId } });
    return m ? keMasterDto((await petakanMaster(fasyankesId, [m]))[0]) : null;
  }

  async tarifLab(fasyankesId: number): Promise<TarifLabDto[]> {
    return (await prisma.tarifLayanan.findMany({ where: { fasyankes_id: fasyankesId, jenis: 'lab', aktif: true }, orderBy: { nama: 'asc' }, take: 500 })).map(tarifDto);
  }

  async tarifLabSah(fasyankesId: number, id: number): Promise<boolean> {
    return (await prisma.tarifLayanan.count({ where: { id, fasyankes_id: fasyankesId, jenis: 'lab', aktif: true } })) > 0;
  }

  async buatMaster(fasyankesId: number, oleh: number, d: MasterPemeriksaanMasukan): Promise<MasterPemeriksaanDto | null> {
    try {
      const m = await prisma.masterPemeriksaan.create({ data: { fasyankes_id: fasyankesId, jenis: 'lab', ...d, loinc_contoh: false, dibuat_oleh: oleh } });
      return keMasterDto((await petakanMaster(fasyankesId, [m]))[0]);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') return null;
      throw e;
    }
  }

  async ubahMaster(fasyankesId: number, id: number, d: UbahMasterPemeriksaanMasukan): Promise<MasterPemeriksaanDto | null> {
    const ada = await prisma.masterPemeriksaan.findFirst({ where: { id, fasyankes_id: fasyankesId } });
    if (!ada) return null;
    // Kode LOINC yang diubah pengguna bukan lagi contoh seed.
    const loinc = d.kode_loinc !== undefined && d.kode_loinc !== ada.kode_loinc ? { loinc_contoh: false } : {};
    try {
      const m = await prisma.masterPemeriksaan.update({ where: { id }, data: { ...d, ...loinc, diubah_pada: new Date() } });
      return keMasterDto((await petakanMaster(fasyankesId, [m]))[0]);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') throw new BentrokError();
      throw e;
    }
  }
}
