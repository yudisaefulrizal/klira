import { prisma } from '@klira/db';
import type { PersetujuanTindakanDto, TeksPersetujuanDto } from '@klira/shared';

export type KunjunganPersetujuan = { id: number; pasien_id: number; tahap_layanan: string };
export type PasienPersetujuan = { id: number; nama: string; tidak_cakap: boolean };
export type Wali = { id: number; hubungan: string; nama: string };
export type Saksi = { id: number; nama: string };

export type DataPersetujuan = {
  fasyankesId: number;
  pasienId: number;
  kunjunganId: number;
  oleh: number;
  teks: TeksPersetujuanDto;
  tindakanKode: string | null;
  tindakanNama: string;
  penjelasan: string;
  bentuk: 'tertulis' | 'lisan';
  penandatangan: 'pasien' | 'wali';
  waliId: number | null;
  penandatanganNama: string;
  saksiId: number;
  waktu: Date;
};

export interface RepositoriPersetujuan {
  kunjungan(fasyankesId: number, id: number): Promise<KunjunganPersetujuan | null>;
  pasien(fasyankesId: number, id: number): Promise<PasienPersetujuan | null>;
  teksAktif(fasyankesId: number): Promise<TeksPersetujuanDto | null>;
  teksUntukPakai(fasyankesId: number, id: number): Promise<TeksPersetujuanDto | null>;
  wali(fasyankesId: number, pasienId: number): Promise<Wali[]>;
  /** Tenaga kesehatan aktif (berprofil profesi aktif) yang dapat menjadi saksi. */
  saksiOpsi(fasyankesId: number): Promise<Saksi[]>;
  saksi(fasyankesId: number, id: number): Promise<Saksi | null>;
  catat(d: DataPersetujuan): Promise<PersetujuanTindakanDto>;
  daftar(fasyankesId: number, kunjunganId: number): Promise<PersetujuanTindakanDto[]>;
}

const pilihTeks = { id: true, jenis: true, versi: true, judul: true, tujuan: true, isi: true } as const;

export class RepositoriPersetujuanPrisma implements RepositoriPersetujuan {
  async kunjungan(fasyankesId: number, id: number): Promise<KunjunganPersetujuan | null> {
    return prisma.kunjungan.findFirst({ where: { id, fasyankes_id: fasyankesId }, select: { id: true, pasien_id: true, tahap_layanan: true } });
  }

  async pasien(fasyankesId: number, id: number): Promise<PasienPersetujuan | null> {
    return prisma.pasien.findFirst({ where: { id, fasyankes_id: fasyankesId }, select: { id: true, nama: true, tidak_cakap: true } });
  }

  async teksAktif(fasyankesId: number): Promise<TeksPersetujuanDto | null> {
    // Teks klinik sendiri didahulukan, lalu teks bawaan; yang aktif dengan versi tertinggi.
    for (const fas of [fasyankesId, null]) {
      const t = await prisma.teksPersetujuan.findFirst({ where: { fasyankes_id: fas, jenis: 'tindakan', aktif: true }, orderBy: { versi: 'desc' }, select: pilihTeks });
      if (t) return t;
    }
    return null;
  }

  async teksUntukPakai(fasyankesId: number, id: number): Promise<TeksPersetujuanDto | null> {
    return prisma.teksPersetujuan.findFirst({ where: { id, jenis: 'tindakan', aktif: true, OR: [{ fasyankes_id: fasyankesId }, { fasyankes_id: null }] }, select: pilihTeks });
  }

  async wali(fasyankesId: number, pasienId: number): Promise<Wali[]> {
    return prisma.waliKeluarga.findMany({ where: { fasyankes_id: fasyankesId, pasien_id: pasienId }, orderBy: { id: 'asc' }, select: { id: true, hubungan: true, nama: true } });
  }

  async saksiOpsi(fasyankesId: number): Promise<Saksi[]> {
    return prisma.pengguna.findMany({
      where: { fasyankes_id: fasyankesId, aktif: true, profil_profesi: { some: { aktif: true } } }, orderBy: [{ nama: 'asc' }, { id: 'asc' }], select: { id: true, nama: true }, take: 300,
    });
  }

  async saksi(fasyankesId: number, id: number): Promise<Saksi | null> {
    return prisma.pengguna.findFirst({ where: { id, fasyankes_id: fasyankesId, aktif: true, profil_profesi: { some: { aktif: true } } }, select: { id: true, nama: true } });
  }

  async catat(d: DataPersetujuan): Promise<PersetujuanTindakanDto> {
    const p = await prisma.persetujuan.create({
      data: {
        fasyankes_id: d.fasyankesId, pasien_id: d.pasienId, kunjungan_id: d.kunjunganId, jenis: 'tindakan', teks_persetujuan_id: d.teks.id, versi_teks: d.teks.versi, tujuan: d.teks.tujuan,
        penjelasan: d.penjelasan, bentuk: d.bentuk, status: 'diberikan', waktu: d.waktu, penandatangan: d.penandatangan, wali_id: d.waliId, penandatangan_nama: d.penandatanganNama,
        saksi_pengguna_id: d.saksiId, tindakan_kode: d.tindakanKode, tindakan_nama: d.tindakanNama, dibuat_oleh: d.oleh,
      },
    });
    return (await this.daftarDari(d.fasyankesId, [p]))[0];
  }

  async daftar(fasyankesId: number, kunjunganId: number): Promise<PersetujuanTindakanDto[]> {
    return this.daftarDari(
      fasyankesId, await prisma.persetujuan.findMany({ where: { fasyankes_id: fasyankesId, kunjungan_id: kunjunganId, jenis: 'tindakan' }, orderBy: { id: 'asc' }, take: 200 }),
    );
  }

  private async daftarDari(
    fasyankesId: number,
    baris: { id: number; kunjungan_id: number | null; tindakan_kode: string | null; tindakan_nama: string | null; versi_teks: number; tujuan: string; penjelasan: string | null; bentuk: string; status: string; waktu: Date;
      penandatangan: string; penandatangan_nama: string; saksi_pengguna_id: number | null; dibuat_oleh: number | null }[],
  ): Promise<PersetujuanTindakanDto[]> {
    const ids = [...new Set(baris.flatMap((b) => [b.saksi_pengguna_id, b.dibuat_oleh].filter((x): x is number => !!x)))];
    const pengguna = ids.length ? await prisma.pengguna.findMany({ where: { id: { in: ids }, fasyankes_id: fasyankesId }, select: { id: true, nama: true } }) : [];
    const nama = new Map(pengguna.map((x) => [x.id, x.nama]));
    return baris.map((b) => ({
      id: b.id, kunjungan_id: b.kunjungan_id, tindakan_kode: b.tindakan_kode, tindakan_nama: b.tindakan_nama, versi_teks: b.versi_teks, tujuan: b.tujuan, penjelasan: b.penjelasan,
      bentuk: b.bentuk as 'tertulis' | 'lisan', status: b.status, waktu: b.waktu.toISOString(), penandatangan: b.penandatangan as 'pasien' | 'wali', penandatangan_nama: b.penandatangan_nama,
      saksi_nama: b.saksi_pengguna_id ? nama.get(b.saksi_pengguna_id) ?? null : null, dicatat_oleh_nama: b.dibuat_oleh ? nama.get(b.dibuat_oleh) ?? null : null,
    }));
  }
}
