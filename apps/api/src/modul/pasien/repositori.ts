import { prisma, Prisma } from '@klira/db';
import { TAHAP_BERJALAN, rentangHariWib, tanggalWib, formatNomorRm, kodeAntrean, umurTahun } from '@klira/shared';
import type {
  AlasanDuplikat, DaftarPasienDto, FilterPasien, JalurIdentitas, KandidatDuplikatDto, KunjunganAktifDto, PasienBarisDto, PasienDetailDto, StatusIdentitas,
  TahapLayanan, TeksPersetujuanDto,
} from '@klira/shared';
import { statusDariDb } from '../kunjungan/pemetaan';

/** Data registrasi yang sudah dinormalkan (string kosong menjadi null, tanggal YYYY-MM-DD). */
export type DataRegistrasi = {
  jalur_identitas: JalurIdentitas;
  status_identitas: StatusIdentitas;
  nik: string | null;
  nama: string;
  nomor_hp: string | null;
  ibu_kandung: string | null;
  tempat_lahir: string | null;
  tanggal_lahir: string;
  jenis_kelamin: 'laki_laki' | 'perempuan';
  agama: string | null;
  suku: string | null;
  bahasa: string | null;
  pekerjaan: string | null;
  pendidikan: string | null;
  status_kawin: string | null;
  alamat: string | null;
  kode_wilayah: string | null;
  nomor_paspor: string | null;
  nomor_kitas: string | null;
  jkn_nomor_kartu: string | null;
  jkn_kelas_hak: string | null;
  jkn_fktp_terdaftar: string | null;
  tidak_cakap: boolean;
  wali: { hubungan: string; nama: string; kontak: string | null }[];
  persetujuan: { teks: TeksPersetujuanDto; bentuk: string; penandatangan: 'pasien' | 'wali'; wali_ke: number | null; penandatangan_nama: string };
};

export type DataPerbaikanPasien = Omit<DataRegistrasi, 'persetujuan' | 'wali' | 'nomor_hp'> & { nomor_hp?: string | null; wali: { id?: number; hubungan: string; nama: string; kontak: string | null }[] };
export class WaliTidakSahError extends Error {}

export type HasilDaftar = { id: number; nomor_rm: string; nama: string; status_identitas: StatusIdentitas; persetujuan_id: number };

/** NIK sudah dipakai pasien lain di fasyankes ini (pelanggaran keunikan saat menyimpan). */
export class NikKembarError extends Error {}

export interface RepositoriPasien {
  perbaiki(fasyankesId: number, id: number, oleh: number, data: DataPerbaikanPasien): Promise<boolean>;
  cari(fasyankesId: number, f: Pick<FilterPasien, 'cari' | 'tahap' | 'untuk_kunjungan'> & { tanggal?: string } & { lewati: number; ambil: number }): Promise<DaftarPasienDto>;
  detail(fasyankesId: number, id: number): Promise<PasienDetailDto | null>;
  duplikat(fasyankesId: number, k: { nik?: string | null; nama?: string; tanggal_lahir?: string; ibu_kandung?: string }): Promise<KandidatDuplikatDto[]>;
  teksAktif(fasyankesId: number, jenis: 'general'): Promise<TeksPersetujuanDto | null>;
  teksUntukPakai(fasyankesId: number, id: number, jenis: 'general'): Promise<TeksPersetujuanDto | null>;
  daftarkan(fasyankesId: number, oleh: number, d: DataRegistrasi): Promise<HasilDaftar>;
}

const tgl = (d: Date): string => d.toISOString().slice(0, 10);
const tglDb = (t: string): Date => new Date(`${t}T00:00:00.000Z`);
const iso = (d: Date): string => d.toISOString();
const pilihTeks = { id: true, jenis: true, versi: true, judul: true, tujuan: true, isi: true } as const;

export class RepositoriPasienPrisma implements RepositoriPasien {
  async cari(fasyankesId: number, f: Pick<FilterPasien, 'cari' | 'tahap' | 'untuk_kunjungan'> & { tanggal?: string } & { lewati: number; ambil: number }): Promise<DaftarPasienDto> {
    const { awal, akhir } = rentangHariWib(f.tanggal ?? tanggalWib(new Date()), f.tanggal ?? tanggalWib(new Date()));
    const mulai = { gte: awal, lt: akhir };
    const jumlahTahap = await this.hitungTahap(fasyankesId, mulai);
    const tahapSet: TahapLayanan[] = f.tahap === 'semua' || f.tahap === 'batal' ? [...TAHAP_BERJALAN, 'ditutup'] : [f.tahap];
    const tanggalKunjungan = f.cari && !f.tanggal ? {} : { mulai };
    const filterKunjungan: Prisma.KunjunganWhereInput = f.tahap === 'batal'
      ? { ...tanggalKunjungan, antrean: { is: { status: 'batal' } } }
      : f.tahap === 'semua'
        ? { ...tanggalKunjungan }
        : { ...tanggalKunjungan, tahap_layanan: { in: tahapSet }, NOT: { antrean: { is: { status: 'batal' } } } };
    const halaman = Math.floor(f.lewati / f.ambil) + 1;
    const sertakan = {
      antrean: true,
      peserta: { where: { tipe: 'ATND' as const }, orderBy: { id: 'asc' as const }, take: 1 },
    };

    if (!f.cari) {
      // Tanpa pencarian: kunjungan pada tanggal dan tahap terpilih, yang paling awal dahulu.
      const where = { fasyankes_id: fasyankesId, ...filterKunjungan };
      const [total, kunjungan] = await Promise.all([
        prisma.kunjungan.count({ where }),
        prisma.kunjungan.findMany({ where, orderBy: [{ mulai: 'asc' }, { id: 'asc' }], skip: f.lewati, take: f.ambil, include: { ...sertakan, pasien: true } }),
      ]);
      const baris = await this.petakan(fasyankesId, kunjungan.map((k) => ({ pasien: k.pasien, kunjungan: k })));
      return { data: baris, halaman, ukuran: f.ambil, total, jumlah_tahap: jumlahTahap };
    }

    const digit = /^\d+$/.test(f.cari);
    const where: Prisma.PasienWhereInput = {
      fasyankes_id: fasyankesId,
      ...(f.untuk_kunjungan === 'true' ? { AND: [{ kunjungan: { none: { tahap_layanan: { in: [...TAHAP_BERJALAN] }, NOT: { antrean: { is: { status: 'batal' } } } } } }] } : {}),
      OR: [{ nama: { contains: f.cari } }, { nomor_rm: { contains: f.cari } }, ...(digit ? [{ nik: { startsWith: f.cari } }, { jkn_nomor_kartu: { startsWith: f.cari } }] : [])],
      ...(f.tahap === 'semua' && !f.tanggal ? {} : { kunjungan: { some: filterKunjungan } }),
    };
    const [total, pasien] = await Promise.all([
      prisma.pasien.count({ where }),
      prisma.pasien.findMany({
        where, orderBy: [{ nama: 'asc' }, { id: 'asc' }], skip: f.lewati, take: f.ambil,
        include: { kunjungan: { where: filterKunjungan, orderBy: { id: 'desc' }, take: 1, include: sertakan } },
      }),
    ]);
    const baris = await this.petakan(fasyankesId, pasien.map((p) => ({ pasien: p, kunjungan: p.kunjungan[0] ?? null })));
    return { data: baris, halaman, ukuran: f.ambil, total, jumlah_tahap: jumlahTahap };
  }

  private async hitungTahap(fasyankesId: number, mulai: Prisma.DateTimeFilter): Promise<DaftarPasienDto['jumlah_tahap']> {
    const g = await prisma.kunjungan.groupBy({ by: ['tahap_layanan'], where: { fasyankes_id: fasyankesId, mulai, NOT: { antrean: { is: { status: 'batal' } } } }, _count: { _all: true } });
    const hasil = { menunggu_skrining: 0, pemeriksaan: 0, resep: 0, kasir: 0, ditutup: 0, batal: await prisma.kunjungan.count({ where: { fasyankes_id: fasyankesId, mulai, antrean: { is: { status: 'batal' } } } }) };
    for (const r of g) hasil[r.tahap_layanan] = r._count._all;
    return hasil;
  }

  /** Susun baris minimal; nama poli dan DPJP diambil sekaligus (hanya milik fasyankes ini). */
  private async petakan(
    fasyankesId: number,
    isi: {
      pasien: { id: number; nomor_rm: string; nama: string; jenis_kelamin: 'laki_laki' | 'perempuan'; tanggal_lahir: Date; status_identitas: StatusIdentitas };
      kunjungan: {
        id: number; jenis: 'AMB' | 'IMP'; status: Parameters<typeof statusDariDb>[0]; tahap_layanan: TahapLayanan; cara_pembayaran: 'umum' | 'jkn'; lokasi_id: number | null; mulai: Date;
        antrean: { id: number; nomor: number; status: 'menunggu' | 'dipanggil' | 'dilayani' | 'selesai' | 'batal' } | null;
        peserta: { pengguna_id: number }[];
      } | null;
    }[],
  ): Promise<PasienBarisDto[]> {
    const lokasiIds = [...new Set(isi.flatMap((i) => (i.kunjungan?.lokasi_id ? [i.kunjungan.lokasi_id] : [])))];
    const penggunaIds = [...new Set(isi.flatMap((i) => i.kunjungan?.peserta.map((p) => p.pengguna_id) ?? []))];
    const [lokasi, pengguna] = await Promise.all([
      lokasiIds.length ? prisma.lokasi.findMany({ where: { id: { in: lokasiIds }, fasyankes_id: fasyankesId }, select: { id: true, nama: true } }) : [],
      penggunaIds.length ? prisma.pengguna.findMany({ where: { id: { in: penggunaIds }, fasyankes_id: fasyankesId }, select: { id: true, nama: true } }) : [],
    ]);
    const kunjunganIds = isi.flatMap((i) => (i.kunjungan ? [i.kunjungan.id] : []));
    const lab = kunjunganIds.length
      ? await prisma.orderPenunjang.groupBy({ by: ['kunjungan_id', 'status'], where: { fasyankes_id: fasyankesId, kunjungan_id: { in: kunjunganIds }, status: { not: 'divalidasi' } }, _count: { _all: true } })
      : [];
    const hitungLab = (kunjunganId: number) => {
      let perluSpesimen = 0;
      let perluHasil = 0;
      for (const g of lab) {
        if (g.kunjungan_id !== kunjunganId) continue;
        if (g.status === 'dipesan') perluSpesimen += g._count._all;
        else perluHasil += g._count._all;
      }
      return { perlu_spesimen: perluSpesimen, perlu_hasil: perluHasil };
    };
    const namaPoli = new Map(lokasi.map((l) => [l.id, l.nama]));
    const namaDpjp = new Map(pengguna.map((p) => [p.id, p.nama]));
    return isi.map(({ pasien: p, kunjungan: k }) => {
      const kunjungan: KunjunganAktifDto | null = k && {
        id: k.id, jenis: k.jenis, status: statusDariDb(k.status), tahap_layanan: k.tahap_layanan, cara_pembayaran: k.cara_pembayaran,
        poli_nama: k.lokasi_id ? namaPoli.get(k.lokasi_id) ?? null : null,
        dpjp_nama: k.peserta[0] ? namaDpjp.get(k.peserta[0].pengguna_id) ?? null : null,
        mulai: iso(k.mulai),
        antrean: k.antrean ? { id: k.antrean.id, kode: kodeAntrean(k.antrean.nomor), status: k.antrean.status } : null,
        lab: hitungLab(k.id),
      };
      return {
        id: p.id, nomor_rm: p.nomor_rm, nama: p.nama, jenis_kelamin: p.jenis_kelamin, umur_tahun: umurTahun(tgl(p.tanggal_lahir)),
        status_identitas: p.status_identitas, kunjungan,
      };
    });
  }

  async detail(fasyankesId: number, id: number): Promise<PasienDetailDto | null> {
    const p = await prisma.pasien.findFirst({ where: { id, fasyankes_id: fasyankesId }, include: { wali_keluarga: { orderBy: { id: 'asc' } } } });
    if (!p) return null;
    return {
      id: p.id, nomor_rm: p.nomor_rm, nik: p.nik, nama: p.nama, nomor_hp: p.nomor_hp, ibu_kandung: p.ibu_kandung, tempat_lahir: p.tempat_lahir, tanggal_lahir: tgl(p.tanggal_lahir),
      jenis_kelamin: p.jenis_kelamin, agama: p.agama, suku: p.suku, bahasa: p.bahasa, pekerjaan: p.pekerjaan, pendidikan: p.pendidikan, status_kawin: p.status_kawin,
      alamat: p.alamat, kode_wilayah: p.kode_wilayah, nomor_paspor: p.nomor_paspor, nomor_kitas: p.nomor_kitas, jkn_nomor_kartu: p.jkn_nomor_kartu,
      jkn_kelas_hak: p.jkn_kelas_hak, jkn_fktp_terdaftar: p.jkn_fktp_terdaftar, status_identitas: p.status_identitas, jalur_identitas: p.jalur_identitas as JalurIdentitas,
      tidak_cakap: p.tidak_cakap, wali: p.wali_keluarga.map((w) => ({ id: w.id, hubungan: w.hubungan, nama: w.nama, kontak: w.kontak })),
    };
  }

  async duplikat(fasyankesId: number, k: { nik?: string | null; nama?: string; tanggal_lahir?: string; ibu_kandung?: string }): Promise<KandidatDuplikatDto[]> {
    const hasil = new Map<number, KandidatDuplikatDto>();
    const ke = (p: { id: number; nomor_rm: string; nama: string; tanggal_lahir: Date }, alasan: AlasanDuplikat) =>
      hasil.set(p.id, { id: p.id, nomor_rm: p.nomor_rm, nama: p.nama, tanggal_lahir: tgl(p.tanggal_lahir), alasan });
    if (k.nik) {
      for (const p of await prisma.pasien.findMany({ where: { fasyankes_id: fasyankesId, nik: k.nik }, take: 5 })) ke(p, 'nik');
    }
    if (k.nama && k.tanggal_lahir && k.ibu_kandung) {
      const lain = await prisma.pasien.findMany({
        where: { fasyankes_id: fasyankesId, nama: k.nama, tanggal_lahir: tglDb(k.tanggal_lahir), ibu_kandung: k.ibu_kandung }, take: 5,
      });
      for (const p of lain) if (!hasil.has(p.id)) ke(p, 'nama_lahir_ibu');
    }
    return [...hasil.values()];
  }

  async teksAktif(fasyankesId: number, jenis: 'general'): Promise<TeksPersetujuanDto | null> {
    // Teks klinik sendiri didahulukan, lalu teks bawaan; yang aktif dengan versi tertinggi.
    for (const fas of [fasyankesId, null]) {
      const t = await prisma.teksPersetujuan.findFirst({ where: { fasyankes_id: fas, jenis, aktif: true }, orderBy: { versi: 'desc' }, select: pilihTeks });
      if (t) return { ...t, jenis: t.jenis };
    }
    return null;
  }

  async teksUntukPakai(fasyankesId: number, id: number, jenis: 'general'): Promise<TeksPersetujuanDto | null> {
    return prisma.teksPersetujuan.findFirst({ where: { id, jenis, aktif: true, OR: [{ fasyankes_id: fasyankesId }, { fasyankes_id: null }] }, select: pilihTeks });
  }

  async perbaiki(fasyankesId: number, id: number, oleh: number, data: DataPerbaikanPasien): Promise<boolean> {
    try {
      return await prisma.$transaction(async (tx) => {
        const ada = await tx.$queryRaw<{ id: number }[]>`SELECT id FROM pasien WHERE id = ${id} AND fasyankes_id = ${fasyankesId} FOR UPDATE`;
        if (!ada.length) return false;
        const lama = await tx.waliKeluarga.findMany({ where: { pasien_id: id, fasyankes_id: fasyankesId }, select: { id: true } });
        const ids = data.wali.flatMap((w) => w.id ? [w.id] : []);
        // Keep the IDs referenced by existing consent records; never delete/recreate guardians.
        if (ids.length !== lama.length || ids.some((waliId) => !lama.some((w) => w.id === waliId))) throw new WaliTidakSahError();
        const { wali, tanggal_lahir, ...pasien } = data;
        await tx.pasien.updateMany({ where: { id, fasyankes_id: fasyankesId }, data: { ...pasien, tanggal_lahir: tglDb(tanggal_lahir) } });
        for (const { id: waliId, ...w } of wali) {
          if (waliId) await tx.waliKeluarga.updateMany({ where: { id: waliId, pasien_id: id, fasyankes_id: fasyankesId }, data: w });
          else await tx.waliKeluarga.create({ data: { ...w, pasien_id: id, fasyankes_id: fasyankesId, dibuat_oleh: oleh } });
        }
        return true;
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002' && String(e.meta?.target ?? '').includes('nik')) throw new NikKembarError();
      throw e;
    }
  }

  async daftarkan(fasyankesId: number, oleh: number, d: DataRegistrasi): Promise<HasilDaftar> {
    // Baris urutan dipastikan ada di luar transaksi agar kenaikan di dalamnya bebas balapan pembuatan pertama.
    try {
      await prisma.urutanNomorRm.create({ data: { fasyankes_id: fasyankesId, terakhir: 0 } });
    } catch (e) {
      if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002')) throw e;
    }
    try {
      return await prisma.$transaction(async (tx) => {
        const urutan = await tx.urutanNomorRm.update({ where: { fasyankes_id: fasyankesId }, data: { terakhir: { increment: 1 } } });
        const pasien = await tx.pasien.create({
          data: {
            fasyankes_id: fasyankesId, nomor_rm: formatNomorRm(urutan.terakhir), nik: d.nik, nama: d.nama, nomor_hp: d.nomor_hp, ibu_kandung: d.ibu_kandung, tempat_lahir: d.tempat_lahir,
            tanggal_lahir: tglDb(d.tanggal_lahir), jenis_kelamin: d.jenis_kelamin, agama: d.agama, suku: d.suku, bahasa: d.bahasa, pekerjaan: d.pekerjaan,
            pendidikan: d.pendidikan, status_kawin: d.status_kawin, alamat: d.alamat, kode_wilayah: d.kode_wilayah, nomor_paspor: d.nomor_paspor,
            nomor_kitas: d.nomor_kitas, jkn_nomor_kartu: d.jkn_nomor_kartu, jkn_kelas_hak: d.jkn_kelas_hak, jkn_fktp_terdaftar: d.jkn_fktp_terdaftar,
            status_identitas: d.status_identitas, jalur_identitas: d.jalur_identitas, tidak_cakap: d.tidak_cakap, dibuat_oleh: oleh,
          },
        });
        const waliId: number[] = [];
        for (const w of d.wali) {
          const baru = await tx.waliKeluarga.create({ data: { fasyankes_id: fasyankesId, pasien_id: pasien.id, hubungan: w.hubungan, nama: w.nama, kontak: w.kontak, dibuat_oleh: oleh } });
          waliId.push(baru.id);
        }
        const p = d.persetujuan;
        const persetujuan = await tx.persetujuan.create({
          data: {
            fasyankes_id: fasyankesId, pasien_id: pasien.id, jenis: 'general', teks_persetujuan_id: p.teks.id, versi_teks: p.teks.versi, tujuan: p.teks.tujuan,
            penjelasan: p.teks.isi, bentuk: p.bentuk, status: 'diberikan', penandatangan: p.penandatangan, wali_id: p.wali_ke != null ? waliId[p.wali_ke] ?? null : null,
            penandatangan_nama: p.penandatangan_nama, dibuat_oleh: oleh,
          },
        });
        return { id: pasien.id, nomor_rm: pasien.nomor_rm, nama: pasien.nama, status_identitas: pasien.status_identitas, persetujuan_id: persetujuan.id };
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002' && String(e.meta?.target ?? '').includes('nik')) throw new NikKembarError();
      throw e;
    }
  }
}
