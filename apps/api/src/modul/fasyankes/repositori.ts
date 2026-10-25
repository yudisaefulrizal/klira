import { prisma } from '@klira/db';
import type { ProfilKlinikDto, ProfilKlinikMasukan } from '@klira/shared';

export type BarisRiwayatProfil = { id: number; jenis: string; ringkasan: string; dibuat_oleh_nama: string | null; dibuat_pada: Date };
export type RiwayatBaru = { jenis: 'profil' | 'akreditasi'; ringkasan: string };

export interface RepositoriFasyankes {
  ambil(fasyankesId: number): Promise<ProfilKlinikDto | null>;
  /** Kode registrasi dipakai fasyankes lain (kode unik global). */
  kodeDipakaiLain(fasyankesId: number, kode: string): Promise<boolean>;
  /** Simpan profil dan riwayatnya dalam satu transaksi. */
  simpan(fasyankesId: number, nilai: ProfilKlinikDto, oleh: number, riwayat: RiwayatBaru[]): Promise<ProfilKlinikDto>;
  /** Riwayat milik fasyankes ini, terbaru dahulu. */
  riwayat(fasyankesId: number, lewati: number, ambil: number): Promise<{ total: number; baris: BarisRiwayatProfil[] }>;
}

const pilih = {
  id: true, nama: true, jenis: true, bentuk_usaha: true, kode_registrasi: true, organization_id: true,
  status_akreditasi: true, tanggal_akreditasi: true, puskesmas_wilayah: true,
} as const;
const keDto = (f: { id: number; nama: string; jenis: ProfilKlinikDto['jenis']; bentuk_usaha: string | null; kode_registrasi: string | null; organization_id: string | null; status_akreditasi: string | null; tanggal_akreditasi: Date | null; puskesmas_wilayah: string | null }): ProfilKlinikDto => ({
  ...f, tanggal_akreditasi: f.tanggal_akreditasi ? f.tanggal_akreditasi.toISOString().slice(0, 10) : null,
});

export type NilaiProfil = ProfilKlinikMasukan;

export class RepositoriFasyankesPrisma implements RepositoriFasyankes {
  async ambil(fasyankesId: number): Promise<ProfilKlinikDto | null> {
    const f = await prisma.fasyankes.findUnique({ where: { id: fasyankesId }, select: pilih });
    return f ? keDto(f) : null;
  }

  async kodeDipakaiLain(fasyankesId: number, kode: string): Promise<boolean> {
    return (await prisma.fasyankes.count({ where: { kode_registrasi: kode, id: { not: fasyankesId } } })) > 0;
  }

  async simpan(fasyankesId: number, n: ProfilKlinikDto, oleh: number, riwayat: RiwayatBaru[]): Promise<ProfilKlinikDto> {
    const f = await prisma.$transaction(async (tx) => {
      const baru = await tx.fasyankes.update({
        where: { id: fasyankesId },
        data: {
          nama: n.nama, jenis: n.jenis, bentuk_usaha: n.bentuk_usaha, kode_registrasi: n.kode_registrasi, organization_id: n.organization_id,
          status_akreditasi: n.status_akreditasi, tanggal_akreditasi: n.tanggal_akreditasi ? new Date(n.tanggal_akreditasi) : null, puskesmas_wilayah: n.puskesmas_wilayah,
        },
        select: pilih,
      });
      if (riwayat.length) {
        await tx.riwayatProfil.createMany({ data: riwayat.map((r) => ({ fasyankes_id: fasyankesId, jenis: r.jenis, ringkasan: r.ringkasan.slice(0, 2000), dibuat_oleh: oleh })) });
      }
      return baru;
    });
    return keDto(f);
  }

  async riwayat(fasyankesId: number, lewati: number, ambil: number) {
    const where = { fasyankes_id: fasyankesId };
    const [total, data] = await Promise.all([
      prisma.riwayatProfil.count({ where }),
      prisma.riwayatProfil.findMany({ where, orderBy: [{ dibuat_pada: 'desc' }, { id: 'desc' }], skip: lewati, take: ambil }),
    ]);
    const ids = [...new Set(data.map((r) => r.dibuat_oleh).filter((x): x is number => x !== null))];
    const nama = new Map((await prisma.pengguna.findMany({ where: { id: { in: ids }, fasyankes_id: fasyankesId }, select: { id: true, nama: true } })).map((p) => [p.id, p.nama]));
    return {
      total,
      baris: data.map((r) => ({ id: r.id, jenis: r.jenis, ringkasan: r.ringkasan, dibuat_oleh_nama: r.dibuat_oleh ? nama.get(r.dibuat_oleh) ?? null : null, dibuat_pada: r.dibuat_pada })),
    };
  }
}
