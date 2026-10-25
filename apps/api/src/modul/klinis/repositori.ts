import { prisma, Prisma } from '@klira/db';
import { PEMERIKSAAN_BIDANG, TANDA_VITAL, umurTahun } from '@klira/shared';
import type {
  AnggotaKeluargaDto, AnamnesisIsi, BagianKlinis, BagianTemplat, DiagnosisIsi, FavoritDto, FolderKeluargaDto, IsiBagian, JenisFavorit, KodeTerminologiDto, KonteksKlinisDto, KunjunganDto,
  PemeriksaanIsi, RiwayatKunjunganDto, SalinanKunjunganDto, SistemTerminologi, TandaVitalIsi, TemplatDto, TindakanIsi, TindakLanjutIsi,
} from '@klira/shared';
import { ambilKunjungan, keDto } from '../kunjungan/repositori';
import { tulisPengesahanDalam } from '../rekam-medis/repositori';
import type { TulisPengesahan } from '../rekam-medis/repositori';

type Klien = Prisma.TransactionClient | typeof prisma;

export type KunjunganRingkas = { id: number; pasien_id: number; tahap_layanan: KunjunganDto['tahap_layanan'] };

/** Penulisan serempak berebut versi yang sama (unique): pemanggil diminta memuat ulang. */
export class BentrokVersiError extends Error {
  constructor() {
    super('bentrok versi catatan');
  }
}

export interface RepositoriKlinis {
  kunjungan(fasyankesId: number, id: number): Promise<KunjunganRingkas | null>;
  kunjunganDto(fasyankesId: number, id: number): Promise<KunjunganDto | null>;
  penggunaAda(fasyankesId: number, id: number): Promise<boolean>;
  /** Isi versi terbaru suatu bagian; bagian tunggal null bila belum ada, bagian daftar `{ item: [] }`. */
  bacaBagian<K extends BagianKlinis>(fasyankesId: number, kunjunganId: number, bagian: K): Promise<IsiBagian[K] | null>;
  /** Isi dan pengesahan ditulis atomik (INSERT saja). */
  simpanBagian(d: { fasyankesId: number; kunjunganId: number; bagian: BagianKlinis; isi: unknown; oleh: number; pengesahan: TulisPengesahan }): Promise<void>;
  konteks(fasyankesId: number, kunjunganId: number): Promise<KonteksKlinisDto | null>;
  riwayatPasien(fasyankesId: number, pasienId: number, kecualiKunjunganId: number | null, batas: number): Promise<RiwayatKunjunganDto[] | null>;
  salinan(fasyankesId: number, sumberId: number): Promise<SalinanKunjunganDto | null>;
  cariTerminologi(sistem: SistemTerminologi, q: string, batas: number): Promise<KodeTerminologiDto[]>;
  daftarFavorit(fasyankesId: number, penggunaId: number, jenis?: JenisFavorit): Promise<FavoritDto[]>;
  tambahFavorit(fasyankesId: number, penggunaId: number, d: { jenis: JenisFavorit; kode: string; nama: string }): Promise<FavoritDto | null>;
  ubahUrutanFavorit(fasyankesId: number, penggunaId: number, id: number, urutan: number): Promise<FavoritDto | null>;
  hapusFavorit(fasyankesId: number, penggunaId: number, id: number): Promise<boolean>;
  daftarTemplat(fasyankesId: number, penggunaId: number, bagian?: BagianTemplat): Promise<TemplatDto[]>;
  tambahTemplat(fasyankesId: number, penggunaId: number, d: { bagian: BagianTemplat; nama: string; isi: Record<string, string | null> }): Promise<TemplatDto>;
  hapusTemplat(fasyankesId: number, penggunaId: number, id: number): Promise<boolean>;
  pasienAda(fasyankesId: number, id: number): Promise<boolean>;
  folderKeluarga(fasyankesId: number, pasienId: number): Promise<FolderKeluargaDto>;
  tautkanKeluarga(fasyankesId: number, oleh: number, pasienId: number, d: { anggota_pasien_id: number; hubungan: string }): Promise<AnggotaKeluargaDto | null>;
  ubahKeluarga(fasyankesId: number, pasienId: number, id: number, d: { hubungan?: string; dibatasi?: boolean }): Promise<AnggotaKeluargaDto | null>;
}

const angka = (v: string): number | null => (Number.isFinite(Number(v)) ? Number(v) : null);

/** Versi aktif suatu bagian = versi pengesahan terakhir (versi kosong, mis. daftar tindakan dikosongkan, tetap terwakili). */
async function versiTerbaru(c: Klien, bagian: BagianKlinis, fasyankesId: number, kunjunganId: number): Promise<number | null> {
  const p = await c.pengesahanCatatan.findFirst({ where: { fasyankes_id: fasyankesId, entitas: bagian, entitas_id: kunjunganId }, orderBy: { versi: 'desc' }, select: { versi: true } });
  return p?.versi ?? null;
}

const kosongTandaVital = (): TandaVitalIsi => Object.fromEntries(TANDA_VITAL.map((t) => [t.kunci, null])) as TandaVitalIsi;
const kosongPemeriksaan = (): PemeriksaanIsi => Object.fromEntries(PEMERIKSAAN_BIDANG.map((b) => [b, null])) as PemeriksaanIsi;

/** Isi bagian pada versi tertentu. */
async function bacaVersi<K extends BagianKlinis>(c: Klien, bagian: K, fasyankesId: number, kunjunganId: number, versi: number | null): Promise<IsiBagian[K] | null> {
  const hasil = await bacaVersiLepas(c, bagian, fasyankesId, kunjunganId, versi);
  return hasil as IsiBagian[K] | null;
}

async function bacaVersiLepas(c: Klien, bagian: BagianKlinis, fasyankesId: number, kunjunganId: number, versi: number | null): Promise<unknown> {
  const where = { fasyankes_id: fasyankesId, kunjungan_id: kunjunganId, versi: versi ?? -1 };
  switch (bagian) {
    case 'anamnesis': {
      const a = await c.anamnesis.findFirst({ where });
      return a ? { keluhan_utama: a.keluhan_utama, penyerta: a.penyerta, riwayat_pribadi: a.riwayat_pribadi, riwayat_keluarga: a.riwayat_keluarga, alergi: a.alergi } satisfies AnamnesisIsi : null;
    }
    case 'tanda_vital': {
      const baris = await c.observasi.findMany({ where: { ...where, kelompok: 'tanda_vital' } });
      if (!baris.length) return null;
      const isi = kosongTandaVital();
      for (const b of baris) if (b.bidang in isi) (isi as Record<string, number | null>)[b.bidang] = angka(b.nilai);
      return isi;
    }
    case 'pemeriksaan': {
      const baris = await c.observasi.findMany({ where: { ...where, kelompok: 'pemeriksaan' } });
      if (!baris.length) return null;
      const isi = kosongPemeriksaan();
      for (const b of baris) if (b.bidang in isi) (isi as Record<string, string | null>)[b.bidang] = b.nilai;
      return isi;
    }
    case 'diagnosis': {
      const baris = await c.diagnosis.findMany({ where, orderBy: { urutan: 'asc' } });
      return { item: baris.map((d) => ({ kode: d.kode_icd10, nama: d.nama, peran: d.peran, snomed: d.kode_snomed })) } satisfies DiagnosisIsi;
    }
    case 'tindakan': {
      const baris = await c.tindakan.findMany({ where, orderBy: { urutan: 'asc' } });
      return {
        item: baris.map((t) => ({ kode: t.kode_icd9cm, nama: t.nama, performer_id: t.performer_id, mulai: t.mulai.toISOString(), selesai: t.selesai?.toISOString() ?? null })),
      } satisfies TindakanIsi;
    }
    case 'tindak_lanjut': {
      const t = await c.tindakLanjut.findFirst({ where });
      return t ? ({ jenis: t.jenis, tujuan: t.tujuan, spri: t.spri, catatan: t.catatan } satisfies TindakLanjutIsi) : null;
    }
  }
}

const KOSONG_DAFTAR = { item: [] };

async function bacaTerbaru<K extends BagianKlinis>(c: Klien, bagian: K, fasyankesId: number, kunjunganId: number): Promise<IsiBagian[K] | null> {
  const v = await versiTerbaru(c, bagian, fasyankesId, kunjunganId);
  const isi = await bacaVersi(c, bagian, fasyankesId, kunjunganId, v);
  if (isi === null && (bagian === 'diagnosis' || bagian === 'tindakan')) return KOSONG_DAFTAR as unknown as IsiBagian[K];
  return isi;
}

async function tulisIsi(tx: Prisma.TransactionClient, bagian: BagianKlinis, isi: unknown, fasyankesId: number, kunjunganId: number, versi: number, oleh: number, waktu: Date): Promise<void> {
  const dasar = { fasyankes_id: fasyankesId, kunjungan_id: kunjunganId, versi, dibuat_oleh: oleh };
  switch (bagian) {
    case 'anamnesis': {
      const a = isi as AnamnesisIsi;
      await tx.anamnesis.create({ data: { ...dasar, keluhan_utama: a.keluhan_utama, penyerta: a.penyerta, riwayat_pribadi: a.riwayat_pribadi, riwayat_keluarga: a.riwayat_keluarga, alergi: a.alergi } });
      return;
    }
    case 'tanda_vital': {
      const tv = isi as TandaVitalIsi;
      const data = TANDA_VITAL.filter((t) => tv[t.kunci] !== null).map((t) => ({
        ...dasar, kelompok: 'tanda_vital' as const, bidang: t.kunci, kode_loinc: t.loinc, nilai: String(tv[t.kunci]), satuan_ucum: t.satuan, waktu,
      }));
      await tx.observasi.createMany({ data });
      return;
    }
    case 'pemeriksaan': {
      const p = isi as PemeriksaanIsi;
      const data = PEMERIKSAAN_BIDANG.filter((b) => p[b] !== null).map((b) => ({ ...dasar, kelompok: 'pemeriksaan' as const, bidang: b, nilai: p[b] as string, waktu }));
      await tx.observasi.createMany({ data });
      return;
    }
    case 'diagnosis': {
      const d = isi as DiagnosisIsi;
      await tx.diagnosis.createMany({ data: d.item.map((x, urutan) => ({ ...dasar, kode_icd10: x.kode, nama: x.nama, kode_snomed: x.snomed, peran: x.peran, urutan })) });
      return;
    }
    case 'tindakan': {
      const t = isi as TindakanIsi;
      await tx.tindakan.createMany({
        data: t.item.map((x, urutan) => ({ ...dasar, kode_icd9cm: x.kode, nama: x.nama, performer_id: x.performer_id ?? null, mulai: new Date(x.mulai), selesai: x.selesai ? new Date(x.selesai) : null, urutan })),
      });
      return;
    }
    case 'tindak_lanjut': {
      const t = isi as TindakLanjutIsi;
      await tx.tindakLanjut.create({ data: { ...dasar, jenis: t.jenis, tujuan: t.tujuan, spri: t.spri, catatan: t.catatan } });
      return;
    }
  }
}

const folderKeDto = (k: { id: number; hubungan: string; dibatasi: boolean; anggota: { id: number; nama: string; nomor_rm: string } }): AnggotaKeluargaDto => ({
  id: k.id, hubungan: k.hubungan, dibatasi: k.dibatasi, pasien: k.dibatasi ? null : { id: k.anggota.id, nama: k.anggota.nama, nomor_rm: k.anggota.nomor_rm },
});
const sorotAnggota = { select: { id: true, nama: true, nomor_rm: true } } as const;

const favoritKeDto = (f: { id: number; jenis: JenisFavorit; kode: string; nama: string; urutan: number }): FavoritDto => ({ id: f.id, jenis: f.jenis, kode: f.kode, nama: f.nama, urutan: f.urutan });
const templatKeDto = (t: { id: number; bagian: BagianTemplat; nama: string; isi: Prisma.JsonValue }): TemplatDto => ({ id: t.id, bagian: t.bagian, nama: t.nama, isi: t.isi as Record<string, string | null> });

export class RepositoriKlinisPrisma implements RepositoriKlinis {
  async kunjungan(fasyankesId: number, id: number): Promise<KunjunganRingkas | null> {
    return prisma.kunjungan.findFirst({ where: { id, fasyankes_id: fasyankesId }, select: { id: true, pasien_id: true, tahap_layanan: true } });
  }

  async kunjunganDto(fasyankesId: number, id: number): Promise<KunjunganDto | null> {
    if (!(await prisma.kunjungan.count({ where: { id, fasyankes_id: fasyankesId } }))) return null;
    return keDto(await ambilKunjungan(prisma, id));
  }

  async penggunaAda(fasyankesId: number, id: number): Promise<boolean> {
    return (await prisma.pengguna.count({ where: { id, fasyankes_id: fasyankesId, aktif: true } })) > 0;
  }

  bacaBagian<K extends BagianKlinis>(fasyankesId: number, kunjunganId: number, bagian: K): Promise<IsiBagian[K] | null> {
    return bacaTerbaru(prisma, bagian, fasyankesId, kunjunganId);
  }

  async simpanBagian(d: { fasyankesId: number; kunjunganId: number; bagian: BagianKlinis; isi: unknown; oleh: number; pengesahan: TulisPengesahan }): Promise<void> {
    try {
      await prisma.$transaction(async (tx) => {
        // Versi isi mengikuti versi pengesahan; baris yang sama tidak boleh ditulis dua kali (unique) sehingga penulisan serempak gagal bersih.
        await tulisIsi(tx, d.bagian, d.isi, d.fasyankesId, d.kunjunganId, d.pengesahan.versi, d.oleh, d.pengesahan.waktu);
        await tulisPengesahanDalam(tx, d.pengesahan);
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && (e.code === 'P2002' || e.code === 'P2034')) throw new BentrokVersiError();
      throw e;
    }
  }

  async konteks(fasyankesId: number, kunjunganId: number): Promise<KonteksKlinisDto | null> {
    const k = await prisma.kunjungan.findFirst({
      where: { id: kunjunganId, fasyankes_id: fasyankesId },
      include: { pasien: true, peserta: { where: { tipe: 'ATND' }, orderBy: { id: 'asc' }, take: 1 } },
    });
    if (!k) return null;
    const [poli, dpjp, anamnesisTerbaru, diagnosisTerbaru, observasiTerbaru] = await Promise.all([
      k.lokasi_id ? prisma.lokasi.findFirst({ where: { id: k.lokasi_id, fasyankes_id: fasyankesId }, select: { nama: true } }) : null,
      k.peserta[0] ? prisma.pengguna.findFirst({ where: { id: k.peserta[0].pengguna_id, fasyankes_id: fasyankesId }, select: { nama: true } }) : null,
      prisma.anamnesis.findFirst({ where: { fasyankes_id: fasyankesId, kunjungan: { pasien_id: k.pasien_id } }, orderBy: { id: 'desc' }, select: { alergi: true } }),
      prisma.diagnosis.findFirst({ where: { fasyankes_id: fasyankesId, kunjungan: { pasien_id: k.pasien_id } }, orderBy: { id: 'desc' }, select: { kunjungan_id: true, versi: true } }),
      prisma.observasi.findFirst({ where: { fasyankes_id: fasyankesId, kelompok: 'tanda_vital', kunjungan: { pasien_id: k.pasien_id } }, orderBy: { id: 'desc' }, select: { kunjungan_id: true, versi: true } }),
    ]);
    const diagnosis = diagnosisTerbaru ? await bacaVersi(prisma, 'diagnosis', fasyankesId, diagnosisTerbaru.kunjungan_id, diagnosisTerbaru.versi) : null;
    const tandaVital = observasiTerbaru ? await bacaVersi(prisma, 'tanda_vital', fasyankesId, observasiTerbaru.kunjungan_id, observasiTerbaru.versi) : null;
    return {
      pasien: { id: k.pasien.id, nama: k.pasien.nama, nomor_rm: k.pasien.nomor_rm, jenis_kelamin: k.pasien.jenis_kelamin, umur_tahun: umurTahun(k.pasien.tanggal_lahir.toISOString().slice(0, 10)) },
      kunjungan: {
        id: k.id, jenis: k.jenis, tahap_layanan: k.tahap_layanan, cara_pembayaran: k.cara_pembayaran, poli_nama: poli?.nama ?? null, dpjp_nama: dpjp?.nama ?? null, keluhan_singkat: k.keluhan_singkat,
      },
      alergi: anamnesisTerbaru?.alergi ?? null,
      diagnosis_aktif: (diagnosis?.item ?? []).map((d) => ({ kode: d.kode, nama: d.nama })),
      tanda_vital_terakhir: tandaVital,
    };
  }

  async riwayatPasien(fasyankesId: number, pasienId: number, kecualiKunjunganId: number | null, batas: number): Promise<RiwayatKunjunganDto[] | null> {
    if (!(await prisma.pasien.count({ where: { id: pasienId, fasyankes_id: fasyankesId } }))) return null;
    const daftar = await prisma.kunjungan.findMany({
      where: { fasyankes_id: fasyankesId, pasien_id: pasienId, ...(kecualiKunjunganId ? { id: { not: kecualiKunjunganId } } : {}) },
      orderBy: { id: 'desc' }, take: batas, select: { id: true, mulai: true, jenis: true, lokasi_id: true },
    });
    if (!daftar.length) return [];
    const ids = daftar.map((k) => k.id);
    const where = { fasyankes_id: fasyankesId, kunjungan_id: { in: ids } };
    const [anamnesis, diagnosis, lanjut, poli] = await Promise.all([
      prisma.anamnesis.findMany({ where, orderBy: { versi: 'desc' }, select: { kunjungan_id: true, keluhan_utama: true } }),
      prisma.diagnosis.findMany({ where, orderBy: [{ versi: 'desc' }, { urutan: 'asc' }], select: { kunjungan_id: true, versi: true, kode_icd10: true, nama: true, peran: true } }),
      prisma.tindakLanjut.findMany({ where, orderBy: { versi: 'desc' }, select: { kunjungan_id: true, jenis: true } }),
      prisma.lokasi.findMany({ where: { fasyankes_id: fasyankesId, id: { in: daftar.flatMap((k) => (k.lokasi_id ? [k.lokasi_id] : [])) } }, select: { id: true, nama: true } }),
    ]);
    return daftar.map((k) => {
      const dx = diagnosis.filter((d) => d.kunjungan_id === k.id);
      const versiDx = dx[0]?.versi;
      return {
        id: k.id, mulai: k.mulai.toISOString(), jenis: k.jenis, poli_nama: poli.find((p) => p.id === k.lokasi_id)?.nama ?? null,
        keluhan_utama: anamnesis.find((a) => a.kunjungan_id === k.id)?.keluhan_utama ?? null,
        diagnosis: dx.filter((d) => d.versi === versiDx).map((d) => ({ kode: d.kode_icd10, nama: d.nama, peran: d.peran })),
        tindak_lanjut: lanjut.find((l) => l.kunjungan_id === k.id)?.jenis ?? null,
      };
    });
  }

  async salinan(fasyankesId: number, sumberId: number): Promise<SalinanKunjunganDto | null> {
    const k = await prisma.kunjungan.findFirst({ where: { id: sumberId, fasyankes_id: fasyankesId }, select: { id: true, mulai: true } });
    if (!k) return null;
    const [anamnesis, diagnosis, tindakan] = await Promise.all([
      bacaTerbaru(prisma, 'anamnesis', fasyankesId, k.id),
      bacaTerbaru(prisma, 'diagnosis', fasyankesId, k.id),
      bacaTerbaru(prisma, 'tindakan', fasyankesId, k.id),
    ]);
    return {
      sumber: { id: k.id, mulai: k.mulai.toISOString() },
      anamnesis, diagnosis: diagnosis?.item.length ? diagnosis : null, tindakan: tindakan?.item.length ? tindakan : null,
    };
  }

  /** Urutan saran: kode diawali kata, nama diawali kata, lalu nama memuat kata; dibatasi `batas` hasil. */
  async cariTerminologi(sistem: SistemTerminologi, q: string, batas: number): Promise<KodeTerminologiDto[]> {
    const dasar = { sistem, aktif: true };
    const pilih = { sistem: true, kode: true, nama: true, contoh: true } as const;
    const awal = (where: Prisma.KodeTerminologiWhereInput) => prisma.kodeTerminologi.findMany({ where: { ...dasar, ...where }, orderBy: { kode: 'asc' }, take: batas, select: pilih });
    const [kode, namaAwal, namaMemuat] = await Promise.all([
      awal({ kode: { startsWith: q } }), awal({ nama: { startsWith: q } }), awal({ nama: { contains: q } }),
    ]);
    const lihat = new Set<string>();
    const hasil: KodeTerminologiDto[] = [];
    for (const b of [...kode, ...namaAwal, ...namaMemuat]) {
      if (lihat.has(b.kode)) continue;
      lihat.add(b.kode);
      hasil.push(b);
    }
    return hasil.slice(0, batas);
  }

  async daftarFavorit(fasyankesId: number, penggunaId: number, jenis?: JenisFavorit): Promise<FavoritDto[]> {
    const baris = await prisma.favoritDokter.findMany({ where: { fasyankes_id: fasyankesId, pengguna_id: penggunaId, ...(jenis ? { jenis } : {}) }, orderBy: [{ urutan: 'asc' }, { id: 'asc' }], take: 200 });
    return baris.map(favoritKeDto);
  }

  async tambahFavorit(fasyankesId: number, penggunaId: number, d: { jenis: JenisFavorit; kode: string; nama: string }): Promise<FavoritDto | null> {
    const terakhir = await prisma.favoritDokter.aggregate({ where: { pengguna_id: penggunaId, jenis: d.jenis }, _max: { urutan: true } });
    try {
      return favoritKeDto(await prisma.favoritDokter.create({ data: { fasyankes_id: fasyankesId, pengguna_id: penggunaId, ...d, urutan: (terakhir._max.urutan ?? -1) + 1, dibuat_oleh: penggunaId } }));
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') return null;
      throw e;
    }
  }

  async ubahUrutanFavorit(fasyankesId: number, penggunaId: number, id: number, urutan: number): Promise<FavoritDto | null> {
    const hasil = await prisma.favoritDokter.updateMany({ where: { id, fasyankes_id: fasyankesId, pengguna_id: penggunaId }, data: { urutan } });
    if (!hasil.count) return null;
    return favoritKeDto(await prisma.favoritDokter.findUniqueOrThrow({ where: { id } }));
  }

  async hapusFavorit(fasyankesId: number, penggunaId: number, id: number): Promise<boolean> {
    return (await prisma.favoritDokter.deleteMany({ where: { id, fasyankes_id: fasyankesId, pengguna_id: penggunaId } })).count > 0;
  }

  async daftarTemplat(fasyankesId: number, penggunaId: number, bagian?: BagianTemplat): Promise<TemplatDto[]> {
    const baris = await prisma.templatCatatan.findMany({ where: { fasyankes_id: fasyankesId, pengguna_id: penggunaId, ...(bagian ? { bagian } : {}) }, orderBy: { nama: 'asc' }, take: 200 });
    return baris.map(templatKeDto);
  }

  async tambahTemplat(fasyankesId: number, penggunaId: number, d: { bagian: BagianTemplat; nama: string; isi: Record<string, string | null> }): Promise<TemplatDto> {
    return templatKeDto(await prisma.templatCatatan.create({ data: { fasyankes_id: fasyankesId, pengguna_id: penggunaId, bagian: d.bagian, nama: d.nama, isi: d.isi, dibuat_oleh: penggunaId } }));
  }

  async hapusTemplat(fasyankesId: number, penggunaId: number, id: number): Promise<boolean> {
    return (await prisma.templatCatatan.deleteMany({ where: { id, fasyankes_id: fasyankesId, pengguna_id: penggunaId } })).count > 0;
  }

  async pasienAda(fasyankesId: number, id: number): Promise<boolean> {
    return (await prisma.pasien.count({ where: { id, fasyankes_id: fasyankesId } })) > 0;
  }

  async folderKeluarga(fasyankesId: number, pasienId: number): Promise<FolderKeluargaDto> {
    const [wali, anggota] = await Promise.all([
      prisma.waliKeluarga.findMany({ where: { fasyankes_id: fasyankesId, pasien_id: pasienId }, orderBy: { id: 'asc' }, take: 50 }),
      prisma.keluargaPasien.findMany({ where: { fasyankes_id: fasyankesId, pasien_id: pasienId }, orderBy: { id: 'asc' }, take: 100, include: { anggota: sorotAnggota } }),
    ]);
    return { wali: wali.map((w) => ({ id: w.id, hubungan: w.hubungan, nama: w.nama, kontak: w.kontak })), anggota: anggota.map(folderKeDto) };
  }

  async tautkanKeluarga(fasyankesId: number, oleh: number, pasienId: number, d: { anggota_pasien_id: number; hubungan: string }): Promise<AnggotaKeluargaDto | null> {
    try {
      const k = await prisma.keluargaPasien.create({
        data: { fasyankes_id: fasyankesId, pasien_id: pasienId, anggota_pasien_id: d.anggota_pasien_id, hubungan: d.hubungan, dibuat_oleh: oleh }, include: { anggota: sorotAnggota },
      });
      return folderKeDto(k);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') return null;
      throw e;
    }
  }

  async ubahKeluarga(fasyankesId: number, pasienId: number, id: number, d: { hubungan?: string; dibatasi?: boolean }): Promise<AnggotaKeluargaDto | null> {
    const hasil = await prisma.keluargaPasien.updateMany({ where: { id, fasyankes_id: fasyankesId, pasien_id: pasienId }, data: d });
    if (!hasil.count) return null;
    return folderKeDto(await prisma.keluargaPasien.findUniqueOrThrow({ where: { id }, include: { anggota: sorotAnggota } }));
  }
}
