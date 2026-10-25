import { prisma } from '@klira/db';
import type { Prisma } from '@klira/db';
import { SKEMA_MASTER } from '@klira/shared';
import type { BarisMaster, FilterMaster, JenisMaster, JenisMasterUbah, OpsiMasterDto, SumberOpsiMaster, z } from '@klira/shared';

export type MasukanMaster = { [J in JenisMasterUbah]: z.infer<(typeof SKEMA_MASTER)[J]> };
export type HasilDaftar = { total: number; baris: BarisMaster[] };

export interface RepositoriMaster {
  daftar(fasyankesId: number, jenis: JenisMaster, f: FilterMaster): Promise<HasilDaftar>;
  ambil(fasyankesId: number, jenis: JenisMasterUbah, id: number): Promise<BarisMaster | null>;
  buat(fasyankesId: number, jenis: JenisMasterUbah, data: MasukanMaster[JenisMasterUbah], oleh: number): Promise<BarisMaster>;
  /** Ubah baris milik fasyankes ini; praktisi tidak mengubah pengguna_id. */
  ubah(fasyankesId: number, jenis: JenisMasterUbah, id: number, data: Partial<MasukanMaster[JenisMasterUbah]>): Promise<BarisMaster>;
  setAktif(fasyankesId: number, jenis: JenisMasterUbah, id: number, aktif: boolean): Promise<BarisMaster>;
  opsi(fasyankesId: number, sumber: SumberOpsiMaster, cari?: string): Promise<OpsiMasterDto[]>;
  lokasiAda(fasyankesId: number, id: number, jenis: 'poli' | 'ruang'): Promise<boolean>;
  penggunaAda(fasyankesId: number, id: number): Promise<boolean>;
  punyaProfil(fasyankesId: number, penggunaId: number): Promise<boolean>;
  tarifKodeAda(fasyankesId: number, kode: string, kecualiId?: number): Promise<boolean>;
  tambahRiwayatProfil(fasyankesId: number, jenis: 'sip', penggunaId: number, ringkasan: string, oleh: number): Promise<void>;
}

const tgl = (d: Date | null): string | null => (d ? d.toISOString().slice(0, 10) : null);
const LOKASI = ['poli', 'ruang', 'bed'] as const;
const UKURAN_OPSI = 500;

const barisLokasi = (l: { id: number; nama: string; induk_id: number | null; status_operasional: 'U' | 'O'; ihs_location_id: string | null; induk: { nama: string } | null }): BarisMaster => ({
  id: l.id, aktif: l.status_operasional === 'O', nama: l.nama, induk_id: l.induk_id, induk_nama: l.induk?.nama ?? null,
  status_operasional: l.status_operasional, ihs_location_id: l.ihs_location_id,
});
const barisPraktisi = (p: { id: number; pengguna_id: number; profesi: string; nomor_sip: string | null; masa_berlaku_sip: Date | null; ihs_practitioner_id: string | null; aktif: boolean; pengguna: { nama: string } }): BarisMaster => ({
  id: p.id, aktif: p.aktif, pengguna_id: p.pengguna_id, pengguna_nama: p.pengguna.nama, profesi: p.profesi, nomor_sip: p.nomor_sip,
  masa_berlaku_sip: tgl(p.masa_berlaku_sip), ihs_practitioner_id: p.ihs_practitioner_id,
});
type BarisJadwal = { id: number; pengguna_id: number; lokasi_id: number; hari: number; jam_mulai: string; jam_selesai: string; kuota: number; berlaku_dari: Date; berlaku_sampai: Date | null; aktif: boolean; pengguna: { nama: string }; lokasi: { nama: string } };
const barisJadwal = (j: BarisJadwal): BarisMaster => ({
  id: j.id, aktif: j.aktif, pengguna_id: j.pengguna_id, pengguna_nama: j.pengguna.nama, lokasi_id: j.lokasi_id, lokasi_nama: j.lokasi.nama,
  hari: j.hari, jam_mulai: j.jam_mulai, jam_selesai: j.jam_selesai, kuota: j.kuota, berlaku_dari: tgl(j.berlaku_dari), berlaku_sampai: tgl(j.berlaku_sampai),
});
const barisTarif = (t: { id: number; kode: string; nama: string; jenis: string; harga_umum: number; harga_jkn: number | null; aktif: boolean }): BarisMaster => ({
  id: t.id, aktif: t.aktif, kode: t.kode, nama: t.nama, jenis: t.jenis, harga_umum: t.harga_umum, harga_jkn: t.harga_jkn,
});

const sertaLokasi = { induk: { select: { nama: true } } } as const;
const sertaPraktisi = { pengguna: { select: { nama: true } } } as const;
const sertaJadwal = { pengguna: { select: { nama: true } }, lokasi: { select: { nama: true } } } as const;

export class RepositoriMasterPrisma implements RepositoriMaster {
  async daftar(fasyankesId: number, jenis: JenisMaster, f: FilterMaster): Promise<HasilDaftar> {
    const halaman = { skip: (f.halaman - 1) * f.ukuran, take: f.ukuran };
    const cari = f.cari;
    const aktif = f.status === 'semua' ? undefined : f.status === 'aktif';
    if (jenis === 'poli' || jenis === 'ruang' || jenis === 'bed') {
      const where: Prisma.LokasiWhereInput = {
        fasyankes_id: fasyankesId, jenis,
        ...(aktif === undefined ? {} : { status_operasional: aktif ? 'O' : 'U' }),
        ...(cari ? { OR: [{ nama: { contains: cari } }, { ihs_location_id: { contains: cari } }, { induk: { nama: { contains: cari } } }] } : {}),
      };
      const [total, data] = await Promise.all([
        prisma.lokasi.count({ where }),
        prisma.lokasi.findMany({ where, include: sertaLokasi, orderBy: [{ nama: 'asc' }, { id: 'asc' }], ...halaman }),
      ]);
      return { total, baris: data.map(barisLokasi) };
    }
    if (jenis === 'praktisi') {
      const where: Prisma.ProfilProfesiWhereInput = {
        fasyankes_id: fasyankesId, ...(aktif === undefined ? {} : { aktif }),
        ...(cari ? { OR: [{ pengguna: { nama: { contains: cari } } }, { profesi: { contains: cari } }, { nomor_sip: { contains: cari } }] } : {}),
      };
      const [total, data] = await Promise.all([
        prisma.profilProfesi.count({ where }),
        prisma.profilProfesi.findMany({ where, include: sertaPraktisi, orderBy: [{ pengguna: { nama: 'asc' } }, { id: 'asc' }], ...halaman }),
      ]);
      return { total, baris: data.map(barisPraktisi) };
    }
    if (jenis === 'jadwal') {
      const where: Prisma.JadwalPraktikWhereInput = {
        fasyankes_id: fasyankesId, ...(aktif === undefined ? {} : { aktif }),
        ...(cari ? { OR: [{ pengguna: { nama: { contains: cari } } }, { lokasi: { nama: { contains: cari } } }] } : {}),
      };
      const [total, data] = await Promise.all([
        prisma.jadwalPraktik.count({ where }),
        prisma.jadwalPraktik.findMany({ where, include: sertaJadwal, orderBy: [{ hari: 'asc' }, { jam_mulai: 'asc' }, { id: 'asc' }], ...halaman }),
      ]);
      return { total, baris: data.map(barisJadwal) };
    }
    if (jenis === 'tarif') {
      const where: Prisma.TarifLayananWhereInput = {
        fasyankes_id: fasyankesId, ...(aktif === undefined ? {} : { aktif }),
        ...(cari ? { OR: [{ kode: { contains: cari } }, { nama: { contains: cari } }] } : {}),
      };
      const [total, data] = await Promise.all([
        prisma.tarifLayanan.count({ where }),
        prisma.tarifLayanan.findMany({ where, orderBy: [{ jenis: 'asc' }, { kode: 'asc' }], ...halaman }),
      ]);
      return { total, baris: data.map(barisTarif) };
    }
    // Wilayah: referensi global, hanya baca.
    const where: Prisma.WilayahWhereInput = {
      ...(f.tingkat ? { tingkat: f.tingkat } : {}),
      ...(cari ? { OR: [{ kode: { contains: cari } }, { nama: { contains: cari } }] } : {}),
    };
    const [total, data] = await Promise.all([
      prisma.wilayah.count({ where }),
      prisma.wilayah.findMany({ where, orderBy: [{ kode: 'asc' }], ...halaman }),
    ]);
    return { total, baris: data.map((w) => ({ id: w.id, aktif: true, kode: w.kode, nama: w.nama, tingkat: w.tingkat, induk_kode: w.induk_kode, contoh: w.contoh })) };
  }

  async ambil(fasyankesId: number, jenis: JenisMasterUbah, id: number): Promise<BarisMaster | null> {
    if ((LOKASI as readonly string[]).includes(jenis)) {
      const l = await prisma.lokasi.findFirst({ where: { id, fasyankes_id: fasyankesId, jenis: jenis as 'poli' }, include: sertaLokasi });
      return l ? barisLokasi(l) : null;
    }
    if (jenis === 'praktisi') {
      const p = await prisma.profilProfesi.findFirst({ where: { id, fasyankes_id: fasyankesId }, include: sertaPraktisi });
      return p ? barisPraktisi(p) : null;
    }
    if (jenis === 'jadwal') {
      const j = await prisma.jadwalPraktik.findFirst({ where: { id, fasyankes_id: fasyankesId }, include: sertaJadwal });
      return j ? barisJadwal(j) : null;
    }
    const t = await prisma.tarifLayanan.findFirst({ where: { id, fasyankes_id: fasyankesId } });
    return t ? barisTarif(t) : null;
  }

  async buat(fasyankesId: number, jenis: JenisMasterUbah, data: MasukanMaster[JenisMasterUbah], oleh: number): Promise<BarisMaster> {
    const dasar = { fasyankes_id: fasyankesId, dibuat_oleh: oleh };
    if (jenis === 'poli' || jenis === 'ruang' || jenis === 'bed') {
      const d = data as MasukanMaster['ruang'];
      const l = await prisma.lokasi.create({
        data: { ...dasar, jenis, nama: d.nama, induk_id: jenis === 'poli' ? null : (d.induk_id ?? null), status_operasional: d.status_operasional, ihs_location_id: d.ihs_location_id ?? null },
        include: sertaLokasi,
      });
      return barisLokasi(l);
    }
    if (jenis === 'praktisi') {
      const d = data as MasukanMaster['praktisi'];
      const p = await prisma.profilProfesi.create({
        data: { ...dasar, pengguna_id: d.pengguna_id, profesi: d.profesi, nomor_sip: d.nomor_sip ?? null, masa_berlaku_sip: d.masa_berlaku_sip ?? null, ihs_practitioner_id: d.ihs_practitioner_id ?? null },
        include: sertaPraktisi,
      });
      return barisPraktisi(p);
    }
    if (jenis === 'jadwal') {
      const d = data as MasukanMaster['jadwal'];
      const j = await prisma.jadwalPraktik.create({
        data: { ...dasar, pengguna_id: d.pengguna_id, lokasi_id: d.lokasi_id, hari: d.hari, jam_mulai: d.jam_mulai, jam_selesai: d.jam_selesai, kuota: d.kuota, berlaku_dari: d.berlaku_dari, berlaku_sampai: d.berlaku_sampai ?? null },
        include: sertaJadwal,
      });
      return barisJadwal(j);
    }
    const d = data as MasukanMaster['tarif'];
    return barisTarif(await prisma.tarifLayanan.create({ data: { ...dasar, kode: d.kode, nama: d.nama, jenis: d.jenis, harga_umum: d.harga_umum, harga_jkn: d.harga_jkn ?? null } }));
  }

  async ubah(fasyankesId: number, jenis: JenisMasterUbah, id: number, data: Partial<MasukanMaster[JenisMasterUbah]>): Promise<BarisMaster> {
    // Kunci fasyankes_id di where agar tidak pernah melintasi klinik, walau pemanggil lupa memeriksa.
    if ((LOKASI as readonly string[]).includes(jenis)) {
      const d = data as MasukanMaster['ruang'];
      await prisma.lokasi.updateMany({
        where: { id, fasyankes_id: fasyankesId },
        data: { nama: d.nama, status_operasional: d.status_operasional, ihs_location_id: d.ihs_location_id ?? null, ...(jenis === 'poli' ? {} : { induk_id: d.induk_id ?? null }) },
      });
    } else if (jenis === 'praktisi') {
      const d = data as Partial<MasukanMaster['praktisi']>;
      await prisma.profilProfesi.updateMany({
        where: { id, fasyankes_id: fasyankesId },
        data: { profesi: d.profesi, nomor_sip: d.nomor_sip ?? null, masa_berlaku_sip: d.masa_berlaku_sip ?? null, ihs_practitioner_id: d.ihs_practitioner_id ?? null },
      });
    } else if (jenis === 'jadwal') {
      const d = data as MasukanMaster['jadwal'];
      await prisma.jadwalPraktik.updateMany({
        where: { id, fasyankes_id: fasyankesId },
        data: { pengguna_id: d.pengguna_id, lokasi_id: d.lokasi_id, hari: d.hari, jam_mulai: d.jam_mulai, jam_selesai: d.jam_selesai, kuota: d.kuota, berlaku_dari: d.berlaku_dari, berlaku_sampai: d.berlaku_sampai ?? null },
      });
    } else {
      const d = data as MasukanMaster['tarif'];
      await prisma.tarifLayanan.updateMany({ where: { id, fasyankes_id: fasyankesId }, data: { kode: d.kode, nama: d.nama, jenis: d.jenis, harga_umum: d.harga_umum, harga_jkn: d.harga_jkn ?? null } });
    }
    return (await this.ambil(fasyankesId, jenis, id)) as BarisMaster;
  }

  async setAktif(fasyankesId: number, jenis: JenisMasterUbah, id: number, aktif: boolean): Promise<BarisMaster> {
    const where = { id, fasyankes_id: fasyankesId };
    if ((LOKASI as readonly string[]).includes(jenis)) await prisma.lokasi.updateMany({ where, data: { status_operasional: aktif ? 'O' : 'U' } });
    else if (jenis === 'praktisi') await prisma.profilProfesi.updateMany({ where, data: { aktif } });
    else if (jenis === 'jadwal') await prisma.jadwalPraktik.updateMany({ where, data: { aktif } });
    else await prisma.tarifLayanan.updateMany({ where, data: { aktif } });
    return (await this.ambil(fasyankesId, jenis, id)) as BarisMaster;
  }

  async opsi(fasyankesId: number, sumber: SumberOpsiMaster, cari?: string): Promise<OpsiMasterDto[]> {
    if (sumber === 'poli' || sumber === 'ruang') {
      const l = await prisma.lokasi.findMany({
        where: { fasyankes_id: fasyankesId, jenis: sumber, status_operasional: 'O', ...(cari ? { nama: { contains: cari } } : {}) },
        orderBy: [{ nama: 'asc' }], take: UKURAN_OPSI, select: { id: true, nama: true },
      });
      return l.map((x) => ({ nilai: String(x.id), label: x.nama }));
    }
    if (sumber === 'praktisi') {
      const p = await prisma.pengguna.findMany({
        where: { fasyankes_id: fasyankesId, aktif: true, profil_profesi: { some: { aktif: true } }, ...(cari ? { nama: { contains: cari } } : {}) },
        orderBy: [{ nama: 'asc' }], take: UKURAN_OPSI, select: { id: true, nama: true },
      });
      return p.map((x) => ({ nilai: String(x.id), label: x.nama }));
    }
    const p = await prisma.pengguna.findMany({
      where: { fasyankes_id: fasyankesId, aktif: true, profil_profesi: { none: {} }, ...(cari ? { nama: { contains: cari } } : {}) },
      orderBy: [{ nama: 'asc' }], take: UKURAN_OPSI, select: { id: true, nama: true },
    });
    return p.map((x) => ({ nilai: String(x.id), label: x.nama }));
  }

  async lokasiAda(fasyankesId: number, id: number, jenis: 'poli' | 'ruang'): Promise<boolean> {
    return (await prisma.lokasi.count({ where: { id, fasyankes_id: fasyankesId, jenis } })) > 0;
  }

  async penggunaAda(fasyankesId: number, id: number): Promise<boolean> {
    return (await prisma.pengguna.count({ where: { id, fasyankes_id: fasyankesId } })) > 0;
  }

  async punyaProfil(fasyankesId: number, penggunaId: number): Promise<boolean> {
    return (await prisma.profilProfesi.count({ where: { pengguna_id: penggunaId, fasyankes_id: fasyankesId } })) > 0;
  }

  async tarifKodeAda(fasyankesId: number, kode: string, kecualiId?: number): Promise<boolean> {
    return (await prisma.tarifLayanan.count({ where: { fasyankes_id: fasyankesId, kode, ...(kecualiId ? { id: { not: kecualiId } } : {}) } })) > 0;
  }

  async tambahRiwayatProfil(fasyankesId: number, jenis: 'sip', penggunaId: number, ringkasan: string, oleh: number): Promise<void> {
    await prisma.riwayatProfil.create({ data: { fasyankes_id: fasyankesId, jenis, pengguna_id: penggunaId, ringkasan: ringkasan.slice(0, 2000), dibuat_oleh: oleh } });
  }
}
