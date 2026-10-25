import { pengaturanKeamananEfektif } from '@klira/shared';
import type { Halaman, PengaturanKeamananDto, PengaturanKeamananMasukan, PenggunaSaya, RiwayatBackupDto } from '@klira/shared';
import type { PenampungAudit } from '../../middleware/audit';
import type { BarisPengaturan, RepositoriKeamanan } from './repositori';

export type DependensiKeamanan = { repo: RepositoriKeamanan; audit: PenampungAudit };

const keDto = (b: BarisPengaturan | null): PengaturanKeamananDto => ({
  ...pengaturanKeamananEfektif(b),
  bawaan: b === null,
  diubah_pada: b ? b.diubah_pada.toISOString() : null,
});

/** Nilai yang dibaca auth (sesi, pembatas, kata sandi); bawaan aman bila belum ada pengaturan. */
export async function bacaPengaturanKeamanan(repo: Pick<RepositoriKeamanan, 'ambilPengaturan'>, fasyankesId: number): Promise<PengaturanKeamananMasukan> {
  return pengaturanKeamananEfektif(await repo.ambilPengaturan(fasyankesId));
}

export function buatLayananKeamanan({ repo, audit }: DependensiKeamanan) {
  return {
    async ambil(p: Pick<PenggunaSaya, 'fasyankes_id'>): Promise<PengaturanKeamananDto> {
      return keDto(await repo.ambilPengaturan(p.fasyankes_id));
    },

    async simpan(p: Pick<PenggunaSaya, 'id' | 'fasyankes_id'>, nilai: PengaturanKeamananMasukan, alamat?: string): Promise<PengaturanKeamananDto> {
      const baris = await repo.simpanPengaturan(p.fasyankes_id, nilai, p.id);
      await audit.catat({
        fasyankes_id: p.fasyankes_id, pengguna_id: p.id, aksi: 'perbaikan', entitas: 'pengaturan_keamanan', entitas_id: null,
        keterangan: `Kebijakan akses: sesi ${nilai.masa_sesi_jam} jam, batas percobaan ${nilai.batas_percobaan_masuk}, kata sandi minimal ${nilai.panjang_minimum_kata_sandi}`,
        alamat,
      });
      return keDto(baris);
    },

    async daftarBackup(p: Pick<PenggunaSaya, 'fasyankes_id'>, halaman: number, ukuran: number): Promise<Halaman<RiwayatBackupDto>> {
      const { total, baris } = await repo.daftarBackup(p.fasyankes_id, (halaman - 1) * ukuran, ukuran);
      return {
        data: baris.map((b) => ({ id: b.id, waktu: b.waktu.toISOString(), status: b.status, ukuran_byte: b.ukuran_byte, lokasi: b.lokasi })),
        halaman, ukuran, total,
      };
    },
  };
}

export type LayananKeamanan = ReturnType<typeof buatLayananKeamanan>;
