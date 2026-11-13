import * as db from '@klira/db';
import type { FilterPengguna, PenggunaDaftarDto } from '@klira/shared';

export type HasilDaftar = { total: number; baris: PenggunaDaftarDto[] };

export interface RepositoriPengguna {
  daftar(fasyankesId: number, f: FilterPengguna, sekarang: Date): Promise<HasilDaftar>;
  /** Ubah status aktif; null bila pengguna bukan milik fasyankes ini. */
  ubahAktif(fasyankesId: number, id: number, aktif: boolean): Promise<{ id: number; nama: string; aktif: boolean; aktifSebelumnya: boolean } | null>;
}



export class RepositoriPenggunaMysql implements RepositoriPengguna {
  async daftar(fasyankesId: number, f: FilterPengguna, sekarang: Date): Promise<HasilDaftar> {


    const [total, data] = await Promise.all([
      db.hitungPenggunaUntukDaftar(fasyankesId, f.cari, (f.cari) && (true), f.status === 'aktif', (f.status !== 'semua') && (true), f.jenis_akun_id, true, sekarang, null, sekarang, (f.jenis_akun_id) && (true)),
      db.daftarPenggunaUntukDaftar(fasyankesId, f.cari, (f.cari) && (true), f.status === 'aktif', (f.status !== 'semua') && (true), f.jenis_akun_id, true, sekarang, null, sekarang, (f.jenis_akun_id) && (true), f.ukuran, (f.halaman - 1) * f.ukuran, 'tambah', false, 'terima'),
    ]);
    return {
      total,
      baris: data.map((p) => ({
        id: p.id, nama: p.nama, username: p.username, aktif: p.aktif,
        jenis_akun_aktif: [...new Set(p.penugasan_jenis.map((x) => x.jenis_akun.nama))],
        jumlah_izin_tambahan: p.izin_per_akun.length,
        jumlah_peringatan_terbuka: p.peringatan_izin.length,
      })),
    };
  }

  async ubahAktif(fasyankesId: number, id: number, aktif: boolean) {
    const p = await db.cariPenggunaUntukUbahAktif(id, fasyankesId);
    if (!p) return null;
    if (p.aktif !== aktif) await db.ubahPenggunaUntukUbahAktif(aktif, id);
    return { id: p.id, nama: p.nama, aktif, aktifSebelumnya: p.aktif };
  }
}
