import { prisma, Prisma } from '@klira/db';
import type {
  AlasanHukum, FilterLaporan, FilterPembukaan, FilterPenyampaian, HalamanPembukaanDto, HalamanPenyampaianDto, JenisSurat, LaporanDto, PembukaanDto, PembukaanMasukan, PenyampaianDto, PenyampaianMasukan, ResumeIsi, SuratDto,
} from '@klira/shared';
import { tulisPengesahanDalam } from './repositori';
import type { TulisPengesahan } from './repositori';

const tglIso = (d: Date): string => d.toISOString().slice(0, 10);
const awalHariUtc = (): Date => new Date(`${tglIso(new Date())}T00:00:00.000Z`);
const rentangWib = (tanggal: string): Date => new Date(`${tanggal}T00:00:00.000+07:00`);

export type ResumeBaris = { isi: ResumeIsi; diperbarui_pada: Date };
export type PasienMini = { id: number; nama: string; nomor_rm: string };
export type PembukaanBaris = { id: number; status: 'diajukan' | 'disetujui' | 'ditolak'; diminta_oleh: number };

/** Akses data dokumen Rekam medis: resume, surat, pembukaan, penyampaian, laporan. Hanya INSERT, dan UPDATE terkontrol atas resume dan keputusan pembukaan; tidak ada hapus. */
export class RepositoriDokumenPrisma {
  async pasien(fasyankesId: number, id: number): Promise<PasienMini | null> {
    return prisma.pasien.findFirst({ where: { id, fasyankes_id: fasyankesId }, select: { id: true, nama: true, nomor_rm: true } });
  }

  async kunjunganAda(fasyankesId: number, id: number, pasienId: number): Promise<boolean> {
    return (await prisma.kunjungan.count({ where: { id, fasyankes_id: fasyankesId, pasien_id: pasienId } })) > 0;
  }

  // ---- Resume ----
  async resume(fasyankesId: number, kunjunganId: number): Promise<ResumeBaris | null> {
    const r = await prisma.resumeMedis.findFirst({ where: { fasyankes_id: fasyankesId, kunjungan_id: kunjunganId } });
    return r && { isi: r.isi as ResumeIsi, diperbarui_pada: r.diperbarui_pada };
  }

  async simpanResume(d: { fasyankesId: number; kunjunganId: number; isi: ResumeIsi; oleh: number; pengesahan: Omit<TulisPengesahan, 'fasyankesId' | 'entitas' | 'entitasId'> }): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const isi = d.isi as unknown as Prisma.InputJsonValue;
      await tx.resumeMedis.upsert({
        where: { kunjungan_id: d.kunjunganId },
        update: { isi, diperbarui_pada: new Date() },
        create: { fasyankes_id: d.fasyankesId, kunjungan_id: d.kunjunganId, isi, dibuat_oleh: d.oleh },
      });
      await tulisPengesahanDalam(tx, { ...d.pengesahan, fasyankesId: d.fasyankesId, entitas: 'resume_medis', entitasId: d.kunjunganId });
    });
  }

  // ---- Surat ----
  async daftarSurat(fasyankesId: number, kunjunganId: number): Promise<SuratDto[]> {
    const baris = await prisma.surat.findMany({ where: { fasyankes_id: fasyankesId, kunjungan_id: kunjunganId }, orderBy: { id: 'desc' } });
    const orang = new Map((await prisma.pengguna.findMany({ where: { id: { in: [...new Set(baris.map((b) => b.dokter_id))] } }, select: { id: true, nama: true } })).map((u) => [u.id, u.nama]));
    return baris.map((b) => ({ id: b.id, jenis: b.jenis as JenisSurat, nomor_surat: b.nomor_surat, tujuan: b.tujuan, isi: b.isi, dokter_nama: orang.get(b.dokter_id) ?? null, dibuat_pada: b.dibuat_pada.toISOString() }));
  }

  /** Nomor berurutan per hari (S-TTTTBBHH-NNN); bila dua pengajuan serempak mendapat nomor sama, keunikan memaksa ulang. */
  async buatSurat(d: { fasyankesId: number; kunjunganId: number; jenis: JenisSurat; tujuan: string | null; isi: string; dokterId: number }): Promise<{ id: number; nomor: string }> {
    for (let percobaan = 0; ; percobaan++) {
      try {
        const awal = awalHariUtc();
        const urut = (await prisma.surat.count({ where: { fasyankes_id: d.fasyankesId, dibuat_pada: { gte: awal } } })) + 1 + percobaan;
        const nomor = `S-${tglIso(awal).replaceAll('-', '')}-${String(urut).padStart(3, '0')}`;
        const s = await prisma.surat.create({ data: { fasyankes_id: d.fasyankesId, kunjungan_id: d.kunjunganId, jenis: d.jenis, nomor_surat: nomor, tujuan: d.tujuan, isi: d.isi, dokter_id: d.dokterId } });
        return { id: s.id, nomor };
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002' && percobaan < 5) continue;
        throw e;
      }
    }
  }

  // ---- Pembukaan ----
  async buatPembukaan(fasyankesId: number, m: PembukaanMasukan, olehId: number): Promise<number> {
    return (await prisma.pembukaanRm.create({
      data: {
        fasyankes_id: fasyankesId, pasien_id: m.pasien_id, pemohon_nama: m.pemohon_nama, pemohon_instansi: m.pemohon_instansi ?? null, dasar: m.dasar, alasan_hukum: m.dasar === 'hukum' ? (m.alasan_hukum ?? null) : null,
        dasar_rinci: m.dasar_rinci, cakupan: m.cakupan, identitas_disamarkan: m.identitas_disamarkan ?? true, diminta_oleh: olehId,
      },
    })).id;
  }

  async pembukaan(fasyankesId: number, id: number): Promise<PembukaanBaris | null> {
    const p = await prisma.pembukaanRm.findFirst({ where: { id, fasyankes_id: fasyankesId }, select: { id: true, status: true, diminta_oleh: true } });
    return p;
  }

  /** Keputusan atomik: hanya bila masih diajukan. */
  async putuskanPembukaan(fasyankesId: number, id: number, status: 'disetujui' | 'ditolak', penyetujuId: number, catatan: string | null): Promise<boolean> {
    const r = await prisma.pembukaanRm.updateMany({ where: { id, fasyankes_id: fasyankesId, status: 'diajukan' }, data: { status, penyetuju_id: penyetujuId, catatan_keputusan: catatan, waktu_keputusan: new Date() } });
    return r.count > 0;
  }

  async daftarPembukaan(fasyankesId: number, f: FilterPembukaan): Promise<HalamanPembukaanDto> {
    const where: Prisma.PembukaanRmWhereInput = { fasyankes_id: fasyankesId, ...(f.status ? { status: f.status } : {}) };
    const [total, menunggu, baris] = await Promise.all([
      prisma.pembukaanRm.count({ where }),
      prisma.pembukaanRm.count({ where: { fasyankes_id: fasyankesId, status: 'diajukan' } }),
      prisma.pembukaanRm.findMany({ where, orderBy: { id: 'desc' }, skip: (f.halaman - 1) * f.ukuran, take: f.ukuran }),
    ]);
    const pasien = new Map((await prisma.pasien.findMany({ where: { id: { in: [...new Set(baris.map((b) => b.pasien_id))] } }, select: { id: true, nama: true, nomor_rm: true } })).map((p) => [p.id, p]));
    const orang = new Map((await prisma.pengguna.findMany({ where: { id: { in: [...new Set(baris.flatMap((b) => [b.diminta_oleh, ...(b.penyetuju_id ? [b.penyetuju_id] : [])]))] } }, select: { id: true, nama: true } })).map((u) => [u.id, u.nama]));
    const data: PembukaanDto[] = baris.map((b) => ({
      id: b.id, pasien_id: b.pasien_id, pasien_nama: pasien.get(b.pasien_id)?.nama ?? '-', pasien_nomor_rm: pasien.get(b.pasien_id)?.nomor_rm ?? '-', pemohon_nama: b.pemohon_nama, pemohon_instansi: b.pemohon_instansi,
      dasar: b.dasar, alasan_hukum: b.alasan_hukum as AlasanHukum | null, dasar_rinci: b.dasar_rinci, cakupan: b.cakupan, identitas_disamarkan: b.identitas_disamarkan, status: b.status,
      penyetuju_nama: b.penyetuju_id ? orang.get(b.penyetuju_id) ?? null : null, catatan_keputusan: b.catatan_keputusan, waktu_keputusan: b.waktu_keputusan?.toISOString() ?? null,
      diminta_oleh_nama: orang.get(b.diminta_oleh) ?? null, dibuat_pada: b.dibuat_pada.toISOString(),
    }));
    return { data, halaman: f.halaman, ukuran: f.ukuran, total, menunggu };
  }

  // ---- Penyampaian ----
  async buatPenyampaian(fasyankesId: number, m: PenyampaianMasukan, petugasId: number): Promise<number> {
    return (await prisma.penyampaianRm.create({
      data: { fasyankes_id: fasyankesId, pasien_id: m.pasien_id, kunjungan_id: m.kunjungan_id ?? null, penerima_nama: m.penerima_nama, hubungan: m.hubungan, bentuk: m.bentuk, bukti_persetujuan: m.bukti_persetujuan ?? null, catatan: m.catatan ?? null, petugas_id: petugasId },
    })).id;
  }

  async daftarPenyampaian(fasyankesId: number, f: FilterPenyampaian): Promise<HalamanPenyampaianDto> {
    const cari = f.cari?.trim();
    const where: Prisma.PenyampaianRmWhereInput = {
      fasyankes_id: fasyankesId,
      ...(cari ? { OR: [{ penerima_nama: { contains: cari } }, { pasien_id: { in: (await prisma.pasien.findMany({ where: { fasyankes_id: fasyankesId, OR: [{ nama: { contains: cari } }, { nomor_rm: { contains: cari } }] }, select: { id: true } })).map((p) => p.id) } }] } : {}),
    };
    const [total, baris] = await Promise.all([
      prisma.penyampaianRm.count({ where }),
      prisma.penyampaianRm.findMany({ where, orderBy: { id: 'desc' }, skip: (f.halaman - 1) * f.ukuran, take: f.ukuran }),
    ]);
    const pasien = new Map((await prisma.pasien.findMany({ where: { id: { in: [...new Set(baris.map((b) => b.pasien_id))] } }, select: { id: true, nama: true, nomor_rm: true } })).map((p) => [p.id, p]));
    const orang = new Map((await prisma.pengguna.findMany({ where: { id: { in: [...new Set(baris.map((b) => b.petugas_id))] } }, select: { id: true, nama: true } })).map((u) => [u.id, u.nama]));
    const data: PenyampaianDto[] = baris.map((b) => ({
      id: b.id, pasien_id: b.pasien_id, pasien_nama: pasien.get(b.pasien_id)?.nama ?? '-', pasien_nomor_rm: pasien.get(b.pasien_id)?.nomor_rm ?? '-', kunjungan_id: b.kunjungan_id, penerima_nama: b.penerima_nama,
      hubungan: b.hubungan as PenyampaianDto['hubungan'], bentuk: b.bentuk, bukti_persetujuan: b.bukti_persetujuan, catatan: b.catatan, petugas_nama: orang.get(b.petugas_id) ?? null, waktu: b.waktu.toISOString(),
    }));
    return { data, halaman: f.halaman, ukuran: f.ukuran, total };
  }

  // ---- Laporan (kunjungan yang sudah ditutup, rentang menurut waktu tutup; bawaan 30 hari terakhir) ----
  async laporan(fasyankesId: number, f: FilterLaporan): Promise<LaporanDto> {
    const sampai = f.sampai ?? tglIso(new Date(Date.now() + 7 * 3_600_000));
    const dari = f.dari ?? tglIso(new Date(new Date(`${sampai}T00:00:00Z`).getTime() - 29 * 86_400_000));
    const rentang = { gte: rentangWib(dari), lt: new Date(rentangWib(sampai).getTime() + 86_400_000) };
    const dasar = { fasyankes_id: fasyankesId, tahap_layanan: 'ditutup' as const, waktu_tutup: rentang };

    if (f.jenis === 'kunjungan_per_poli') {
      const g = await prisma.kunjungan.groupBy({ by: ['lokasi_id'], where: dasar, _count: { _all: true } });
      const lokasi = new Map((await prisma.lokasi.findMany({ where: { id: { in: g.flatMap((x) => (x.lokasi_id ? [x.lokasi_id] : [])) } }, select: { id: true, nama: true } })).map((l) => [l.id, l.nama]));
      const baris = g.map((x): [string, number] => [x.lokasi_id ? lokasi.get(x.lokasi_id) ?? '-' : 'Tanpa poli', x._count._all]).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
      return { jenis: f.jenis, dari, sampai, kolom: ['Poli', 'Kunjungan'], baris, total: baris.reduce((s, b) => s + b[1], 0) };
    }
    if (f.jenis === 'status_pengkodean') {
      const ditutup = await prisma.kunjungan.findMany({ where: dasar, select: { id: true } });
      const sudah = await prisma.pengkodean.count({ where: { fasyankes_id: fasyankesId, kunjungan_id: { in: ditutup.map((k) => k.id) } } });
      const baris: [string, number][] = [['Sudah dikodekan', sudah], ['Belum dikodekan', ditutup.length - sudah]];
      return { jenis: f.jenis, dari, sampai, kolom: ['Status', 'Kunjungan'], baris, total: ditutup.length };
    }
    // Diagnosis terbanyak: kode final bila ada, selain itu diagnosis utama dokter versi terakhir.
    const ditutup = await prisma.kunjungan.findMany({ where: dasar, select: { id: true } });
    const ids = ditutup.map((k) => k.id);
    const final = new Map<number, { kode: string; nama: string }>();
    for (const p of await prisma.pengkodean.findMany({ where: { fasyankes_id: fasyankesId, kunjungan_id: { in: ids } }, select: { kunjungan_id: true, isi: true } })) {
      const u = (p.isi as { diagnosis: { kode: string; nama: string; peran: string }[] }).diagnosis.find((d) => d.peran === 'utama');
      if (u) final.set(p.kunjungan_id, { kode: u.kode, nama: u.nama });
    }
    const diag = await prisma.diagnosis.findMany({ where: { fasyankes_id: fasyankesId, kunjungan_id: { in: ids.filter((i) => !final.has(i)) }, peran: 'utama' }, orderBy: { versi: 'asc' }, select: { kunjungan_id: true, kode_icd10: true, nama: true } });
    const terakhir = new Map(diag.map((d) => [d.kunjungan_id, { kode: d.kode_icd10, nama: d.nama }]));
    const hitung = new Map<string, { nama: string; n: number }>();
    for (const d of [...final.values(), ...terakhir.values()]) hitung.set(d.kode, { nama: d.nama, n: (hitung.get(d.kode)?.n ?? 0) + 1 });
    const baris = [...hitung].map(([kode, v]): [string, string, number] => [kode, v.nama, v.n]).sort((a, b) => b[2] - a[2] || a[0].localeCompare(b[0])).slice(0, 20);
    return { jenis: f.jenis, dari, sampai, kolom: ['Kode ICD-10', 'Diagnosis', 'Kunjungan'], baris, total: final.size + terakhir.size };
  }
}
