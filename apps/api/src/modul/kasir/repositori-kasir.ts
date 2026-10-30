import { selesaiAntreanDalam } from '../kunjungan/antrean-otomatis';
import { prisma } from '@klira/db';
import type { MetodeBayar, PembayaranDto, RekapHarianDto, ShiftDto, TagihanDto } from '@klira/shared';
import { totalTagihan, keItemDto } from './repositori';

export type KunjunganKasir = { id: number; pasien_id: number; pasien_nama: string; pasien_nomor_rm: string; tahap_layanan: string; cara_pembayaran: 'umum' | 'jkn' };
export type TagihanKasir = TagihanDto & { pembayaran: PembayaranDto[]; dibayar: number; sisa: number };
export type HasilBayarRepo =
  | { ok: true; pembayaran: PembayaranDto; tagihan: TagihanKasir; kembalian: number }
  | { ok: false; sebab: 'tahap_salah' | 'tagihan_kosong' | 'tagihan_belum_lengkap' | 'sudah_lunas' | 'tanpa_shift' };
export type HasilTutupRepo = { ok: true } | { ok: false; sebab: 'tahap_salah' | 'tagihan_belum_lengkap' | 'resep_belum' | 'belum_lunas_alasan' | 'bentrok' };

const hariWib = (d = new Date()): string => new Date(d.getTime() + 7 * 3_600_000).toISOString().slice(0, 10);
const rentangWib = (tanggal: string): { dari: Date; sampai: Date } => {
  const dari = new Date(`${tanggal}T00:00:00.000+07:00`);
  return { dari, sampai: new Date(dari.getTime() + 86_400_000) };
};

export class RepositoriKasirPrisma {
  async kunjungan(fasyankesId: number, id: number): Promise<KunjunganKasir | null> {
    const k = await prisma.kunjungan.findFirst({ where: { id, fasyankes_id: fasyankesId }, include: { pasien: { select: { nama: true, nomor_rm: true } } } });
    return k && { id: k.id, pasien_id: k.pasien_id, pasien_nama: k.pasien.nama, pasien_nomor_rm: k.pasien.nomor_rm, tahap_layanan: k.tahap_layanan, cara_pembayaran: k.cara_pembayaran };
  }

  /** Tagihan lengkap dengan pembayaran; kunjungan tanpa tagihan menghasilkan tagihan kosong (lunas, total 0). */
  async tagihan(fasyankesId: number, kunjunganId: number): Promise<TagihanKasir> {
    const t = await prisma.tagihan.findFirst({ where: { kunjungan_id: kunjunganId, fasyankes_id: fasyankesId }, include: { item: { orderBy: { id: 'asc' } }, pembayaran: { orderBy: { id: 'asc' } } } });
    if (!t) return { id: null, kunjungan_id: kunjunganId, status_tagihan: 'lengkap', status_pembayaran: 'lunas', total: 0, item: [], pembayaran: [], dibayar: 0, sisa: 0, alasan_tutup_belum_lunas: null };
    const nama = new Map((await prisma.pengguna.findMany({ where: { id: { in: [...new Set(t.pembayaran.map((p) => p.kasir_id))] } }, select: { id: true, nama: true } })).map((u) => [u.id, u.nama]));
    const total = totalTagihan(t.item);
    const dibayar = t.pembayaran.reduce((s, p) => s + p.jumlah, 0);
    return {
      id: t.id, kunjungan_id: t.kunjungan_id, status_tagihan: t.status_tagihan, status_pembayaran: t.status_pembayaran, total, item: t.item.map(keItemDto),
      pembayaran: t.pembayaran.map((p) => ({ id: p.id, metode: p.metode, jumlah: p.jumlah, waktu: p.waktu.toISOString(), kasir_nama: nama.get(p.kasir_id) ?? null })),
      dibayar, sisa: Math.max(0, total - dibayar), alasan_tutup_belum_lunas: t.alasan_tutup_belum_lunas,
    };
  }

  // ---- Shift ----
  private async keShiftDto(fasyankesId: number, shifts: { id: number; kasir_id: number; buka: Date; tutup: Date | null; kas_awal: number; kas_akhir: number | null; selisih: number | null; alasan_selisih: string | null }[]): Promise<ShiftDto[]> {
    if (!shifts.length) return [];
    const bayar = await prisma.pembayaran.groupBy({ by: ['shift_id', 'metode'], where: { fasyankes_id: fasyankesId, shift_id: { in: shifts.map((s) => s.id) } }, _sum: { jumlah: true }, _count: { _all: true } });
    const nama = new Map((await prisma.pengguna.findMany({ where: { id: { in: [...new Set(shifts.map((s) => s.kasir_id))] } }, select: { id: true, nama: true } })).map((u) => [u.id, u.nama]));
    return shifts.map((s) => {
      const per = { tunai: 0, transfer: 0, qris: 0 } as Record<MetodeBayar, number>;
      let jumlah = 0;
      for (const b of bayar.filter((x) => x.shift_id === s.id)) {
        per[b.metode] = b._sum.jumlah ?? 0;
        jumlah += b._count._all;
      }
      return {
        id: s.id, kasir_id: s.kasir_id, kasir_nama: nama.get(s.kasir_id) ?? null, buka: s.buka.toISOString(), tutup: s.tutup?.toISOString() ?? null, kas_awal: s.kas_awal, kas_akhir: s.kas_akhir,
        selisih: s.selisih, alasan_selisih: s.alasan_selisih, tunai: per.tunai, transfer: per.transfer, qris: per.qris, jumlah_pembayaran: jumlah, kas_seharusnya: s.kas_awal + per.tunai,
      };
    });
  }

  async shiftTerbuka(fasyankesId: number, kasirId: number): Promise<ShiftDto | null> {
    const s = await prisma.shiftKasir.findFirst({ where: { fasyankes_id: fasyankesId, kasir_id: kasirId, tutup: null }, orderBy: { id: 'desc' } });
    return s ? (await this.keShiftDto(fasyankesId, [s]))[0] : null;
  }

  /** 'sudah_ada' bila kasir ini masih punya shift terbuka (pengecekan dalam transaksi dengan kunci baris pengguna). */
  async bukaShift(fasyankesId: number, kasirId: number, kasAwal: number): Promise<ShiftDto | 'sudah_ada'> {
    const id = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM pengguna WHERE id = ${kasirId} FOR UPDATE`;
      if (await tx.shiftKasir.count({ where: { fasyankes_id: fasyankesId, kasir_id: kasirId, tutup: null } })) return null;
      return (await tx.shiftKasir.create({ data: { fasyankes_id: fasyankesId, kasir_id: kasirId, kas_awal: kasAwal } })).id;
    });
    if (id === null) return 'sudah_ada';
    return (await this.keShiftDto(fasyankesId, [await prisma.shiftKasir.findUniqueOrThrow({ where: { id } })]))[0];
  }

  async tutupShift(fasyankesId: number, kasirId: number, d: { kas_akhir: number; alasan_selisih: string | null }): Promise<ShiftDto | 'tidak_ada'> {
    const s = await prisma.shiftKasir.findFirst({ where: { fasyankes_id: fasyankesId, kasir_id: kasirId, tutup: null }, orderBy: { id: 'desc' } });
    if (!s) return 'tidak_ada';
    const [dto] = await this.keShiftDto(fasyankesId, [s]);
    const baru = await prisma.shiftKasir.updateMany({ where: { id: s.id, tutup: null }, data: { tutup: new Date(), kas_akhir: d.kas_akhir, selisih: d.kas_akhir - dto.kas_seharusnya, alasan_selisih: d.alasan_selisih } });
    if (!baru.count) return 'tidak_ada';
    return (await this.keShiftDto(fasyankesId, [await prisma.shiftKasir.findUniqueOrThrow({ where: { id: s.id } })]))[0];
  }

  /** Rekap per hari (zona Asia/Jakarta): pembayaran per metode dan shift yang dibuka pada hari itu. */
  async rekap(fasyankesId: number, tanggal: string): Promise<RekapHarianDto> {
    const { dari, sampai } = rentangWib(tanggal);
    const [bayar, shifts] = await Promise.all([
      prisma.pembayaran.groupBy({ by: ['metode'], where: { fasyankes_id: fasyankesId, waktu: { gte: dari, lt: sampai } }, _sum: { jumlah: true }, _count: { _all: true } }),
      prisma.shiftKasir.findMany({ where: { fasyankes_id: fasyankesId, buka: { gte: dari, lt: sampai } }, orderBy: { id: 'asc' } }),
    ]);
    const per = { tunai: 0, transfer: 0, qris: 0 } as Record<MetodeBayar, number>;
    let jumlah = 0;
    for (const b of bayar) {
      per[b.metode] = b._sum.jumlah ?? 0;
      jumlah += b._count._all;
    }
    return { tanggal, per_metode: per, total: per.tunai + per.transfer + per.qris, jumlah_pembayaran: jumlah, shift: await this.keShiftDto(fasyankesId, shifts) };
  }

  // ---- Pembayaran ----
  /**
   * Pembayaran dalam transaksi dengan kunci baris tagihan. Jumlah yang diterapkan dibatasi sisa tagihan (selebihnya menjadi kembalian);
   * status pembayaran dihitung ulang (belum, sebagian, lunas). Hanya ditambah, tidak pernah diubah atau dihapus.
   */
  async bayar(fasyankesId: number, kasirId: number, kunjunganId: number, metode: MetodeBayar, diterima: number): Promise<HasilBayarRepo> {
    const hasil = await prisma.$transaction(async (tx) => {
      // Kunci baris tagihan HARUS pernyataan pertama: pembacaan biasa sebelum kunci mengambil potret (REPEATABLE READ) yang sudah usang setelah menunggu.
      const kunci = await tx.$queryRaw<{ id: number }[]>`SELECT id FROM tagihan WHERE kunjungan_id = ${kunjunganId} AND fasyankes_id = ${fasyankesId} FOR UPDATE`;
      const k = await tx.kunjungan.findFirst({ where: { id: kunjunganId, fasyankes_id: fasyankesId }, select: { tahap_layanan: true } });
      if (!k || k.tahap_layanan !== 'kasir') return { ok: false, sebab: 'tahap_salah' } as const;
      if (!kunci.length) return { ok: false, sebab: 'tagihan_kosong' } as const;
      const t = await tx.tagihan.findUniqueOrThrow({ where: { id: kunci[0].id }, include: { item: { select: { jumlah: true, harga: true } }, pembayaran: { select: { jumlah: true } } } });
      if (t.status_tagihan !== 'lengkap') return { ok: false, sebab: 'tagihan_belum_lengkap' } as const;
      const total = totalTagihan(t.item);
      const dibayar = t.pembayaran.reduce((s, p) => s + p.jumlah, 0);
      const sisa = total - dibayar;
      if (sisa <= 0) return { ok: false, sebab: 'sudah_lunas' } as const;
      const shift = await tx.shiftKasir.findFirst({ where: { fasyankes_id: fasyankesId, kasir_id: kasirId, tutup: null }, orderBy: { id: 'desc' } });
      if (!shift) return { ok: false, sebab: 'tanpa_shift' } as const;
      const diterapkan = Math.min(diterima, sisa);
      const p = await tx.pembayaran.create({ data: { fasyankes_id: fasyankesId, tagihan_id: t.id, shift_id: shift.id, metode, jumlah: diterapkan, kasir_id: kasirId } });
      await tx.tagihan.update({ where: { id: t.id }, data: { status_pembayaran: dibayar + diterapkan >= total ? 'lunas' : 'sebagian' } });
      return { ok: true, id: p.id, kembalian: diterima - diterapkan } as const;
    });
    if (!hasil.ok) return hasil;
    const tagihan = await this.tagihan(fasyankesId, kunjunganId);
    const p = tagihan.pembayaran.find((x) => x.id === hasil.id)!;
    return { ok: true, pembayaran: p, tagihan, kembalian: hasil.kembalian };
  }

  // ---- Tutup kunjungan ----
  /** Tutup bila di tahap kasir, tagihan lengkap, semua resep diserahkan; belum lunas hanya dengan alasan. Pembaruan bersyarat tahap (gagal diam bila sudah berubah). */
  async tutup(fasyankesId: number, kunjunganId: number, alasan: string | null): Promise<HasilTutupRepo> {
    return prisma.$transaction(async (tx) => {
      const k = await tx.kunjungan.findFirst({ where: { id: kunjunganId, fasyankes_id: fasyankesId }, select: { tahap_layanan: true } });
      if (!k || k.tahap_layanan !== 'kasir') return { ok: false, sebab: 'tahap_salah' } as const;
      const t = await tx.tagihan.findUnique({ where: { kunjungan_id: kunjunganId }, include: { item: { select: { jumlah: true, harga: true } }, pembayaran: { select: { jumlah: true } } } });
      if (t && t.status_tagihan !== 'lengkap') return { ok: false, sebab: 'tagihan_belum_lengkap' } as const;
      if (await tx.resep.count({ where: { kunjungan_id: kunjunganId, fasyankes_id: fasyankesId, status: { not: 'diserahkan' } } })) return { ok: false, sebab: 'resep_belum' } as const;
      const total = t ? totalTagihan(t.item) : 0;
      const lunas = (t?.pembayaran.reduce((s, p) => s + p.jumlah, 0) ?? 0) >= total;
      if (!lunas && !(alasan && alasan.trim())) return { ok: false, sebab: 'belum_lunas_alasan' } as const;
      const ubah = await tx.kunjungan.updateMany({ where: { id: kunjunganId, fasyankes_id: fasyankesId, tahap_layanan: 'kasir' }, data: { tahap_layanan: 'ditutup', status: 'finished', selesai: new Date(), waktu_tutup: new Date() } });
      if (!ubah.count) return { ok: false, sebab: 'bentrok' } as const;
      await selesaiAntreanDalam(tx, fasyankesId, kunjunganId, new Date());
      if (t && !lunas) await tx.tagihan.update({ where: { id: t.id }, data: { alasan_tutup_belum_lunas: alasan!.trim() } });
      return { ok: true } as const;
    });
  }
}

export { hariWib };
