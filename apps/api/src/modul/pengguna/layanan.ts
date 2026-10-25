import { PENGGUNA } from '@klira/shared';
import type { FilterPengguna, Halaman, PenggunaDaftarDto, PenggunaSaya, UbahPengguna } from '@klira/shared';
import type { PenampungAudit } from '../../middleware/audit';
import type { RepositoriPengguna } from './repositori';

export type DependensiPengguna = { repo: RepositoriPengguna; audit: PenampungAudit; sekarang?: () => Date };

export type HasilUbah =
  | { ok: true; data: { id: number; aktif: boolean } }
  | { ok: false; kode: 'tidak_ditemukan' | 'konflik'; pesan: string };

export function buatLayananPengguna({ repo, audit, sekarang = () => new Date() }: DependensiPengguna) {
  return {
    async daftar(p: Pick<PenggunaSaya, 'fasyankes_id'>, f: FilterPengguna): Promise<Halaman<PenggunaDaftarDto>> {
      const { total, baris } = await repo.daftar(p.fasyankes_id, f, sekarang());
      return { data: baris, halaman: f.halaman, ukuran: f.ukuran, total };
    },

    /** Nonaktifkan/aktifkan (tanpa hapus), tercatat di audit; akun sendiri tidak bisa dinonaktifkan. */
    async ubah(p: Pick<PenggunaSaya, 'id' | 'fasyankes_id'>, id: number, m: UbahPengguna, alamat?: string): Promise<HasilUbah> {
      if (id === p.id && !m.aktif) return { ok: false, kode: 'konflik', pesan: PENGGUNA.tidakBisaNonaktifkanSendiri };
      const hasil = await repo.ubahAktif(p.fasyankes_id, id, m.aktif);
      if (!hasil) return { ok: false, kode: 'tidak_ditemukan', pesan: 'Pengguna tidak ditemukan.' };
      if (hasil.aktifSebelumnya !== m.aktif) {
        await audit.catat({
          fasyankes_id: p.fasyankes_id, pengguna_id: p.id, aksi: 'perbaikan', entitas: 'pengguna', entitas_id: id,
          keterangan: m.aktif ? 'Akun diaktifkan kembali' : 'Akun dinonaktifkan', alamat,
        });
      }
      return { ok: true, data: { id: hasil.id, aktif: hasil.aktif } };
    },
  };
}
export type LayananPengguna = ReturnType<typeof buatLayananPengguna>;
