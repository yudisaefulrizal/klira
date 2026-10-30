import { prisma, Prisma } from '@klira/db';
import { statusStokDari } from '@klira/shared';
import type {
  FilterKfa, FilterMasterObat, FilterRiwayatObat, HalamanMasterObatDto, MasterObatDto, MasterObatMasukan, MutasiStokDto, MutasiStokMasukan, ReferensiKfaDto, ResepDto, RiwayatObatDto,
  StatusResep, StokObatDto, TelaahMasukan, UbahMasterObatMasukan,
} from '@klira/shared';
import { tambahItemTagihanDalam, totalTagihan } from '../kasir/repositori';

export type Kekurangan = { master_obat_id: number; nama: string; butuh: number; tersedia: number };
export type HasilSerahRepo =
  | { ok: true; kekurangan: Kekurangan[] }
  | { ok: false; sebab: 'tidak_ada_resep' | 'belum_siap' | 'sudah_diserahkan' | 'tahap_salah' }
  | { ok: false; sebab: 'stok_kurang'; kekurangan: Kekurangan[] };

export type KunjunganResep = { id: number; pasien_id: number; tahap_layanan: string; cara_pembayaran: 'umum' | 'jkn' };
export type ObatMini = { id: number; nama_tampil: string; satuan: string; harga: number };
export type ItemBaruResep = { master_obat_id: number; aturan_pakai: string; bentuk: string | null; rute: string | null; jumlah: number };
export type HasilMutasi = { ok: true; stok: StokObatDto } | { ok: false; sebab: 'obat_tidak_ada' | 'batch_tidak_ada' | 'stok_tidak_cukup' };

const tglIso = (d: Date): string => d.toISOString().slice(0, 10);
const awalHariUtc = (): Date => new Date(`${tglIso(new Date())}T00:00:00.000Z`);

export class RepositoriFarmasiPrisma {
  // ---- Serah terima obat ----
  /**
   * Serah terima semua resep siap kunjungan ini. Stok dikurangi per batch (kedaluwarsa terdekat lebih dulu, batch kedaluwarsa dilewati) dengan kunci baris,
   * dicatat sebagai mutasi keluar dan pengeluaran obat. Stok kurang hanya diteruskan bila diizinkan (peringatan); jumlah pengeluaran tetap sesuai resep.
   */
  async serahTerima(fasyankesId: number, petugasId: number, kunjunganId: number, izinkan: boolean, alasan: string | null): Promise<HasilSerahRepo> {
    return prisma.$transaction(async (tx) => {
      // Kunci baris resep kunjungan sebagai pernyataan pertama agar dua penyerahan serempak tidak sama-sama membaca status siap.
      await tx.$queryRaw`SELECT id FROM resep WHERE kunjungan_id = ${kunjunganId} AND fasyankes_id = ${fasyankesId} FOR UPDATE`;
      const k = await tx.kunjungan.findFirst({ where: { id: kunjunganId, fasyankes_id: fasyankesId }, select: { tahap_layanan: true } });
      if (!k || k.tahap_layanan === 'ditutup') return { ok: false, sebab: 'tahap_salah' } as const;
      const reseps = await tx.resep.findMany({ where: { kunjungan_id: kunjunganId, fasyankes_id: fasyankesId }, include: { item: { include: { master: true } } }, orderBy: { id: 'asc' } });
      if (!reseps.length) return { ok: false, sebab: 'tidak_ada_resep' } as const;
      if (reseps.some((r) => r.status === 'diajukan' || r.status === 'ditelaah')) return { ok: false, sebab: 'belum_siap' } as const;
      const siap = reseps.filter((r) => r.status === 'siap');
      if (!siap.length) return { ok: false, sebab: 'sudah_diserahkan' } as const;
      const alokasi: { resepId: number; itemId: number; masterId: number; harga: number; butuh: number; ambil: { stokId: number; jumlah: number }[]; kurang: number; nama: string; nomor: string }[] = [];
      const terpakai = new Map<number, number>();
      const hariIni = new Date(`${tglIso(new Date())}T00:00:00.000Z`);
      for (const r of siap) {
        for (const i of r.item) {
          const stok = await tx.$queryRaw<{ id: number; jumlah: number }[]>`SELECT id, jumlah FROM stok_obat WHERE master_obat_id = ${i.master_obat_id} AND fasyankes_id = ${fasyankesId} AND jumlah > 0 AND kedaluwarsa >= ${hariIni} ORDER BY kedaluwarsa, batch FOR UPDATE`;
          let sisa = i.jumlah;
          const ambil: { stokId: number; jumlah: number }[] = [];
          for (const s of stok) {
            const tersedia = s.jumlah - (terpakai.get(s.id) ?? 0);
            if (sisa <= 0 || tersedia <= 0) continue;
            const a = Math.min(tersedia, sisa);
            ambil.push({ stokId: s.id, jumlah: a });
            terpakai.set(s.id, (terpakai.get(s.id) ?? 0) + a);
            sisa -= a;
          }
          alokasi.push({ resepId: r.id, itemId: i.id, masterId: i.master_obat_id, harga: i.master.harga, butuh: i.jumlah, ambil, kurang: sisa, nama: i.master.nama_tampil, nomor: r.nomor_resep });
        }
      }
      const kekurangan = alokasi.filter((a) => a.kurang > 0).map((a) => ({ master_obat_id: a.masterId, nama: a.nama, butuh: a.butuh, tersedia: a.butuh - a.kurang }));
      if (kekurangan.length && !izinkan) return { ok: false, sebab: 'stok_kurang', kekurangan } as const;
      for (const a of alokasi) {
        for (const x of a.ambil) {
          await tx.stokObat.update({ where: { id: x.stokId }, data: { jumlah: { decrement: x.jumlah }, diubah_pada: new Date() } });
          await tx.mutasiStok.create({ data: { fasyankes_id: fasyankesId, stok_id: x.stokId, jenis: 'keluar', jumlah: -x.jumlah, alasan: `Serah terima resep ${a.nomor}`, pengguna_id: petugasId } });
        }
        await tx.pengeluaranObat.create({
          data: { fasyankes_id: fasyankesId, resep_id: a.resepId, item_resep_id: a.itemId, master_obat_id: a.masterId, jumlah: a.butuh, harga: a.harga, stok_kurang: a.kurang > 0, alasan: a.kurang > 0 ? alasan : null, petugas_id: petugasId },
        });
      }
      await tx.resep.updateMany({ where: { id: { in: siap.map((r) => r.id) }, status: 'siap' }, data: { status: 'diserahkan' } });
      return { ok: true, kekurangan } as const;
    });
  }

  /** Referensi KFA (global, baca-saja): pencarian nama atau kode, dibatasi jumlah hasil. */
  async cariKfa(f: FilterKfa): Promise<ReferensiKfaDto[]> {
    const baris = await prisma.referensiKfa.findMany({
      where: { ...(f.tingkat ? { tingkat: f.tingkat } : {}), OR: [{ nama: { contains: f.cari } }, { kode: { contains: f.cari } }] },
      orderBy: [{ nama: 'asc' }], take: f.batas,
    });
    return baris.map((k) => ({
      id: k.id, kode: k.kode, tingkat: k.tingkat, nama: k.nama, bentuk_sediaan: k.bentuk_sediaan, rute: k.rute, satuan: k.satuan, kekuatan: k.kekuatan,
      nomor_izin_edar: k.nomor_izin_edar, produsen: k.produsen, generik: k.generik, status: k.status, contoh: k.contoh,
    }));
  }

  kfa(id: number) {
    return prisma.referensiKfa.findUnique({ where: { id }, select: { id: true, status: true, nama: true, satuan: true } });
  }

  /** Stok yang belum kedaluwarsa dijumlah per obat; kedaluwarsa terdekat hanya dari batch yang masih berisi. */
  private async ringkasStok(fasyankesId: number, ids: readonly number[]): Promise<Map<number, { total: number; terdekat: string | null }>> {
    const hasil = new Map<number, { total: number; terdekat: string | null }>();
    if (!ids.length) return hasil;
    const stok = await prisma.stokObat.findMany({ where: { fasyankes_id: fasyankesId, master_obat_id: { in: [...ids] }, jumlah: { gt: 0 } }, orderBy: { kedaluwarsa: 'asc' } });
    const hariIni = awalHariUtc().getTime();
    for (const s of stok) {
      const sekarang = hasil.get(s.master_obat_id) ?? { total: 0, terdekat: null };
      if (s.kedaluwarsa.getTime() >= hariIni) sekarang.total += s.jumlah;
      sekarang.terdekat ??= tglIso(s.kedaluwarsa);
      hasil.set(s.master_obat_id, sekarang);
    }
    return hasil;
  }

  private keMasterDto(m: { id: number; kfa_id: number; nama_tampil: string; satuan: string; harga: number; aktif: boolean; kfa: { kode: string; nama: string; tingkat: number; contoh: boolean; bentuk_sediaan?: string | null; rute?: string | null } }, ringkas?: { total: number; terdekat: string | null }): MasterObatDto {
    const total = ringkas?.total ?? 0;
    const terdekat = ringkas?.terdekat ?? null;
    return {
      id: m.id, kfa_id: m.kfa_id, kfa_kode: m.kfa.kode, kfa_nama: m.kfa.nama, kfa_tingkat: m.kfa.tingkat, kfa_contoh: m.kfa.contoh, nama_tampil: m.nama_tampil, satuan: m.satuan, harga: m.harga, aktif: m.aktif,
      bentuk_sediaan: m.kfa.bentuk_sediaan ?? null, rute: m.kfa.rute ?? null,
      stok_total: total, kedaluwarsa_terdekat: terdekat, status_stok: statusStokDari(total, terdekat),
    };
  }

  async daftarMaster(fasyankesId: number, f: FilterMasterObat): Promise<HalamanMasterObatDto> {
    const where: Prisma.MasterObatWhereInput = {
      fasyankes_id: fasyankesId,
      ...(f.aktif === undefined ? {} : { aktif: f.aktif }),
      ...(f.cari ? { OR: [{ nama_tampil: { contains: f.cari } }, { kfa: { kode: { contains: f.cari } } }, { kfa: { nama: { contains: f.cari } } }] } : {}),
    };
    const [total, baris] = await Promise.all([
      prisma.masterObat.count({ where }),
      prisma.masterObat.findMany({ where, include: { kfa: true }, orderBy: [{ nama_tampil: 'asc' }], skip: (f.halaman - 1) * f.ukuran, take: f.ukuran }),
    ]);
    const ringkas = await this.ringkasStok(fasyankesId, baris.map((b) => b.id));
    return { data: baris.map((b) => this.keMasterDto(b, ringkas.get(b.id))), halaman: f.halaman, ukuran: f.ukuran, total };
  }

  async master(fasyankesId: number, id: number): Promise<MasterObatDto | null> {
    const m = await prisma.masterObat.findFirst({ where: { id, fasyankes_id: fasyankesId }, include: { kfa: true } });
    if (!m) return null;
    return this.keMasterDto(m, (await this.ringkasStok(fasyankesId, [m.id])).get(m.id));
  }

  /** 'duplikat' bila kode KFA sudah ada di master klinik ini. */
  async buatMaster(fasyankesId: number, oleh: number, d: MasterObatMasukan): Promise<MasterObatDto | 'duplikat'> {
    try {
      const m = await prisma.masterObat.create({
        data: { fasyankes_id: fasyankesId, kfa_id: d.kfa_id, nama_tampil: d.nama_tampil, satuan: d.satuan, harga: d.harga, aktif: d.aktif, dibuat_oleh: oleh },
        include: { kfa: true },
      });
      return this.keMasterDto(m);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') return 'duplikat';
      throw e;
    }
  }

  async ubahMaster(fasyankesId: number, id: number, d: UbahMasterObatMasukan): Promise<MasterObatDto | null> {
    const ada = await prisma.masterObat.updateMany({ where: { id, fasyankes_id: fasyankesId }, data: { ...d, diubah_pada: new Date() } });
    return ada.count ? this.master(fasyankesId, id) : null;
  }

  async stokMaster(fasyankesId: number, masterId: number): Promise<StokObatDto[]> {
    const stok = await prisma.stokObat.findMany({ where: { fasyankes_id: fasyankesId, master_obat_id: masterId }, orderBy: [{ kedaluwarsa: 'asc' }, { batch: 'asc' }] });
    return stok.map((s) => ({ id: s.id, master_obat_id: s.master_obat_id, batch: s.batch, kedaluwarsa: tglIso(s.kedaluwarsa), jumlah: s.jumlah }));
  }

  async riwayatMutasi(fasyankesId: number, masterId: number, batas = 50): Promise<MutasiStokDto[]> {
    const m = await prisma.mutasiStok.findMany({ where: { fasyankes_id: fasyankesId, stok: { master_obat_id: masterId } }, include: { stok: { select: { batch: true } } }, orderBy: { id: 'desc' }, take: batas });
    const nama = new Map((await prisma.pengguna.findMany({ where: { id: { in: [...new Set(m.map((x) => x.pengguna_id))] } }, select: { id: true, nama: true } })).map((u) => [u.id, u.nama]));
    return m.map((x) => ({ id: x.id, stok_id: x.stok_id, batch: x.stok.batch, jenis: x.jenis, jumlah: x.jumlah, alasan: x.alasan, pengguna_nama: nama.get(x.pengguna_id) ?? null, waktu: x.waktu.toISOString() }));
  }

  /**
   * Mutasi stok dalam satu transaksi dengan kunci baris batch. Terima menambah (batch baru dibuat), keluar mengurangi (tidak boleh melebihi stok),
   * koreksi menjadikan jumlah batch sama dengan nilai sebenarnya; selisihnya dicatat bertanda di mutasi_stok (hanya ditambah, tidak diubah).
   */
  async mutasi(fasyankesId: number, penggunaId: number, d: MutasiStokMasukan): Promise<HasilMutasi> {
    return prisma.$transaction(async (tx) => {
      const obat = await tx.masterObat.findFirst({ where: { id: d.master_obat_id, fasyankes_id: fasyankesId }, select: { id: true } });
      if (!obat) return { ok: false, sebab: 'obat_tidak_ada' } as const;
      const kunci = await tx.$queryRaw<{ id: number; jumlah: number }[]>`SELECT id, jumlah FROM stok_obat WHERE master_obat_id = ${d.master_obat_id} AND batch = ${d.batch} AND fasyankes_id = ${fasyankesId} FOR UPDATE`;
      let stokId = kunci[0]?.id;
      const sebelum = kunci[0]?.jumlah ?? 0;
      let sesudah: number;
      if (d.jenis === 'terima') {
        sesudah = sebelum + d.jumlah;
        if (stokId) await tx.stokObat.update({ where: { id: stokId }, data: { jumlah: sesudah, diubah_pada: new Date(), ...(d.kedaluwarsa ? { kedaluwarsa: new Date(`${d.kedaluwarsa}T00:00:00.000Z`) } : {}) } });
        else stokId = (await tx.stokObat.create({ data: { fasyankes_id: fasyankesId, master_obat_id: d.master_obat_id, batch: d.batch, kedaluwarsa: new Date(`${d.kedaluwarsa}T00:00:00.000Z`), jumlah: sesudah, dibuat_oleh: penggunaId } })).id;
      } else {
        if (!stokId) return { ok: false, sebab: 'batch_tidak_ada' } as const;
        if (d.jenis === 'keluar' && d.jumlah > sebelum) return { ok: false, sebab: 'stok_tidak_cukup' } as const;
        sesudah = d.jenis === 'keluar' ? sebelum - d.jumlah : d.jumlah;
        await tx.stokObat.update({ where: { id: stokId }, data: { jumlah: sesudah, diubah_pada: new Date() } });
      }
      await tx.mutasiStok.create({ data: { fasyankes_id: fasyankesId, stok_id: stokId!, jenis: d.jenis, jumlah: sesudah - sebelum, alasan: d.alasan?.trim() || null, pengguna_id: penggunaId } });
      const s = await tx.stokObat.findUniqueOrThrow({ where: { id: stokId! } });
      return { ok: true, stok: { id: s.id, master_obat_id: s.master_obat_id, batch: s.batch, kedaluwarsa: tglIso(s.kedaluwarsa), jumlah: s.jumlah } } as const;
    });
  }

  // ---- Resep ----
  kunjungan(fasyankesId: number, id: number): Promise<KunjunganResep | null> {
    return prisma.kunjungan.findFirst({ where: { id, fasyankes_id: fasyankesId }, select: { id: true, pasien_id: true, tahap_layanan: true, cara_pembayaran: true } });
  }

  /** Obat aktif milik klinik dari daftar id (urutan tidak dijamin). */
  obatAktifDari(fasyankesId: number, ids: readonly number[]): Promise<ObatMini[]> {
    return prisma.masterObat.findMany({ where: { fasyankes_id: fasyankesId, aktif: true, id: { in: [...ids] } }, select: { id: true, nama_tampil: true, satuan: true, harga: true } });
  }

  private async keResepDto(fasyankesId: number, ids: readonly number[]): Promise<ResepDto[]> {
    if (!ids.length) return [];
    const baris = await prisma.resep.findMany({ where: { id: { in: [...ids] }, fasyankes_id: fasyankesId }, include: { item: { include: { master: true }, orderBy: { id: 'asc' } }, telaah: true }, orderBy: { id: 'asc' } });
    const orang = await prisma.pengguna.findMany({ where: { id: { in: [...new Set([...baris.map((b) => b.dpjp_id), ...baris.flatMap((b) => (b.telaah ? [b.telaah.apoteker_id] : []))])] } }, select: { id: true, nama: true } });
    const nama = new Map(orang.map((o) => [o.id, o.nama]));
    const ringkas = await this.ringkasStok(fasyankesId, [...new Set(baris.flatMap((b) => b.item.map((i) => i.master_obat_id)))]);
    return baris.map((r) => ({
      id: r.id, kunjungan_id: r.kunjungan_id, nomor_resep: r.nomor_resep, status: r.status, jenis_pembiayaan: r.jenis_pembiayaan, dpjp_nama: nama.get(r.dpjp_id) ?? null,
      dibuat_pada: r.dibuat_pada.toISOString(), waktu_siap: r.waktu_siap?.toISOString() ?? null,
      item: r.item.map((i) => ({
        id: i.id, master_obat_id: i.master_obat_id, nama: i.master.nama_tampil, satuan: i.master.satuan, aturan_pakai: i.aturan_pakai, bentuk: i.bentuk, rute: i.rute, jumlah: i.jumlah,
        harga: i.master.harga, stok_tersedia: ringkas.get(i.master_obat_id)?.total ?? 0,
      })),
      telaah: r.telaah && { apoteker_nama: nama.get(r.telaah.apoteker_id) ?? null, administratif: r.telaah.administratif, farmasetik: r.telaah.farmasetik, klinis: r.telaah.klinis, catatan: r.telaah.catatan, waktu: r.telaah.waktu.toISOString() },
    }));
  }

  async resepKunjungan(fasyankesId: number, kunjunganId: number): Promise<ResepDto[]> {
    const ids = (await prisma.resep.findMany({ where: { fasyankes_id: fasyankesId, kunjungan_id: kunjunganId }, select: { id: true } })).map((r) => r.id);
    return this.keResepDto(fasyankesId, ids);
  }

  async resep(fasyankesId: number, id: number): Promise<ResepDto | null> {
    return (await this.keResepDto(fasyankesId, [id]))[0] ?? null;
  }

  /**
   * Resep dan item dibuat bersama item tagihan obat (harga master x jumlah) dalam satu transaksi. Nomor resep berurutan per hari
   * (R-TTTTBBHH-NNN); bila dua pengajuan serempak mendapat nomor sama, keunikan memaksa ulang.
   */
  async buatResep(d: { fasyankesId: number; kunjungan: KunjunganResep; dpjpId: number; oleh: number; item: ItemBaruResep[]; obat: ObatMini[] }): Promise<{ resepId: number; tagihan: { status_tagihan: string; status_pembayaran: string; total: number } }> {
    for (let percobaan = 0; ; percobaan++) {
      try {
        return await prisma.$transaction(async (tx) => {
          const awal = awalHariUtc();
          const urut = (await tx.resep.count({ where: { fasyankes_id: d.fasyankesId, dibuat_pada: { gte: awal } } })) + 1;
          const nomor = `R-${tglIso(awal).replaceAll('-', '')}-${String(urut + percobaan).padStart(3, '0')}`;
          const resep = await tx.resep.create({
            data: { fasyankes_id: d.fasyankesId, kunjungan_id: d.kunjungan.id, dpjp_id: d.dpjpId, nomor_resep: nomor, jenis_pembiayaan: d.kunjungan.cara_pembayaran, dibuat_oleh: d.oleh },
          });
          const tagihanBaru = [];
          for (const i of d.item) {
            const baris = await tx.itemResep.create({
              data: { fasyankes_id: d.fasyankesId, resep_id: resep.id, master_obat_id: i.master_obat_id, aturan_pakai: i.aturan_pakai, bentuk: i.bentuk, rute: i.rute, jumlah: i.jumlah, dibuat_oleh: d.oleh },
            });
            const obat = d.obat.find((o) => o.id === i.master_obat_id)!;
            tagihanBaru.push({ jenis: 'obat' as const, tarifId: null, kode: `OBAT-${obat.id}`, nama: obat.nama_tampil, harga: obat.harga, orderPenunjangId: null, jumlah: i.jumlah, itemResepId: baris.id });
          }
          const tagihanId = await tambahItemTagihanDalam(tx, d.fasyankesId, d.kunjungan.id, d.oleh, tagihanBaru);
          const t = await tx.tagihan.findUniqueOrThrow({ where: { id: tagihanId }, include: { item: { select: { jumlah: true, harga: true } } } });
          return { resepId: resep.id, tagihan: { status_tagihan: t.status_tagihan, status_pembayaran: t.status_pembayaran, total: totalTagihan(t.item) } };
        });
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002' && percobaan < 5) continue;
        throw e;
      }
    }
  }

  /** Telaah dicatat bila resep masih diajukan atau ditelaah; status ditelaah hanya bila ketiganya terpenuhi. false bila status sudah berubah. */
  async catatTelaah(fasyankesId: number, resepId: number, apotekerId: number, d: TelaahMasukan): Promise<boolean> {
    const lengkap = d.administratif && d.farmasetik && d.klinis;
    return prisma.$transaction(async (tx) => {
      const ubah = await tx.resep.updateMany({ where: { id: resepId, fasyankes_id: fasyankesId, status: { in: ['diajukan', 'ditelaah'] } }, data: { status: lengkap ? 'ditelaah' : 'diajukan' } });
      if (!ubah.count) return false;
      const isi = { apoteker_id: apotekerId, administratif: d.administratif, farmasetik: d.farmasetik, klinis: d.klinis, catatan: d.catatan?.trim() || null, waktu: new Date() };
      await tx.telaahResep.upsert({ where: { resep_id: resepId }, update: isi, create: { fasyankes_id: fasyankesId, resep_id: resepId, ...isi } });
      return true;
    });
  }

  /** Resep ditelaah menjadi siap; bila semua resep kunjungan siap dan kunjungan masih di tahap resep, tahap maju ke kasir. null bila status bukan ditelaah. */
  async tandaiSiap(fasyankesId: number, resepId: number): Promise<{ kunjunganId: number; tahap: string } | null> {
    return prisma.$transaction(async (tx) => {
      const r = await tx.resep.findFirst({ where: { id: resepId, fasyankes_id: fasyankesId }, select: { kunjungan_id: true } });
      if (!r) return null;
      const ubah = await tx.resep.updateMany({ where: { id: resepId, fasyankes_id: fasyankesId, status: 'ditelaah' }, data: { status: 'siap', waktu_siap: new Date() } });
      if (!ubah.count) return null;
      const belum = await tx.resep.count({ where: { fasyankes_id: fasyankesId, kunjungan_id: r.kunjungan_id, status: { in: ['diajukan', 'ditelaah'] } } });
      if (!belum) await tx.kunjungan.updateMany({ where: { id: r.kunjungan_id, fasyankes_id: fasyankesId, tahap_layanan: 'resep' }, data: { tahap_layanan: 'kasir' } });
      const k = await tx.kunjungan.findUniqueOrThrow({ where: { id: r.kunjungan_id }, select: { tahap_layanan: true } });
      return { kunjunganId: r.kunjungan_id, tahap: k.tahap_layanan };
    });
  }

  async riwayat(fasyankesId: number, f: FilterRiwayatObat): Promise<RiwayatObatDto> {
    const rentang: Prisma.DateTimeFilter = {};
    if (f.dari) rentang.gte = new Date(`${f.dari}T00:00:00.000+07:00`);
    if (f.sampai) rentang.lt = new Date(new Date(`${f.sampai}T00:00:00.000+07:00`).getTime() + 86_400_000);
    const where: Prisma.ResepWhereInput = { fasyankes_id: fasyankesId, ...(f.status ? { status: f.status as StatusResep } : {}), ...(f.dari || f.sampai ? { dibuat_pada: rentang } : {}) };
    const [total, baris] = await Promise.all([
      prisma.resep.count({ where }),
      prisma.resep.findMany({ where, include: { _count: { select: { item: true } }, kunjungan: { include: { pasien: { select: { nama: true, nomor_rm: true } } } } }, orderBy: { id: 'desc' }, skip: (f.halaman - 1) * f.ukuran, take: f.ukuran }),
    ]);
    const nama = new Map((await prisma.pengguna.findMany({ where: { id: { in: [...new Set(baris.map((b) => b.dpjp_id))] } }, select: { id: true, nama: true } })).map((u) => [u.id, u.nama]));
    return {
      data: baris.map((r) => ({
        id: r.id, kunjungan_id: r.kunjungan_id, nomor_resep: r.nomor_resep, pasien_nama: r.kunjungan.pasien.nama, pasien_nomor_rm: r.kunjungan.pasien.nomor_rm, status: r.status,
        jumlah_item: r._count.item, dibuat_pada: r.dibuat_pada.toISOString(), dpjp_nama: nama.get(r.dpjp_id) ?? null,
      })),
      halaman: f.halaman, ukuran: f.ukuran, total,
    };
  }
}
